const WHATSAPP_API_URL = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

async function sendWhatsAppRequest(body: Record<string, unknown>): Promise<void> {
  const response = await fetch(WHATSAPP_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("WhatsApp API error:", response.status, error);
    throw new Error(`WhatsApp API error: ${response.status} ${error}`);
  }
}

export async function sendTextMessage(to: string, text: string): Promise<void> {
  await sendWhatsAppRequest({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body: text },
  });
}

export async function sendInteractiveList(
  to: string,
  headerText: string,
  bodyText: string,
  buttonText: string,
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>
): Promise<void> {
  await sendWhatsAppRequest({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: headerText },
      body: { text: bodyText },
      action: {
        button: buttonText,
        sections,
      },
    },
  });
}

export async function sendInteractiveButtons(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
): Promise<void> {
  await sendWhatsAppRequest({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.map((btn) => ({
          type: "reply",
          reply: { id: btn.id, title: btn.title },
        })),
      },
    },
  });
}
