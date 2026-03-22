import { type NextRequest, NextResponse } from "next/server";
import { verifyWebhook, verifySignature } from "@/lib/whatsapp/verify";
import { handleIncomingMessage } from "@/lib/whatsapp/chatbot";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = verifyWebhook(searchParams);

  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256") ?? "";

    if (!verifySignature(rawBody, signature)) {
      console.error("WhatsApp webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const body = JSON.parse(rawBody);

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages) {
      return NextResponse.json({ status: "ok" }, { status: 200 });
    }

    const messages: Array<Record<string, unknown>> = value.messages;
    const contacts: Array<Record<string, unknown>> = value.contacts ?? [];

    for (const msg of messages) {
      const phone = msg.from as string;
      const contact = contacts.find(
        (c) => (c.wa_id as string) === phone
      );
      const profileName = (contact?.profile as Record<string, string>)
        ?.name;

      let messageText = "";
      let messageType: "text" | "interactive" = "text";
      let interactiveId: string | undefined;

      if (msg.type === "text") {
        messageText = (msg.text as Record<string, string>).body;
      } else if (msg.type === "interactive") {
        messageType = "interactive";
        const interactive = msg.interactive as Record<string, unknown>;
        if (interactive.type === "list_reply") {
          const listReply = interactive.list_reply as Record<string, string>;
          interactiveId = listReply.id;
          messageText = listReply.title;
        } else if (interactive.type === "button_reply") {
          const buttonReply = interactive.button_reply as Record<
            string,
            string
          >;
          interactiveId = buttonReply.id;
          messageText = buttonReply.title;
        }
      } else {
        // Unsupported message type, skip
        continue;
      }

      // Process asynchronously but don't block the response
      handleIncomingMessage(
        phone,
        messageText,
        messageType,
        interactiveId,
        profileName
      ).catch((error) => {
        console.error("Error handling WhatsApp message:", error);
      });
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}
