export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question, mode } = req.body || {};
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Missing question" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Missing OPENAI_API_KEY on server" });
    }

    const instructions =
      "أنت مساعد متخصص في حل مسائل الفيزياء للمرحلة الثانوية. " +
      "إذا كان السؤال ليس فيزياء قل: هذا المساعد مخصص لمسائل الفيزياء فقط. " +
      "اكتب بالعربية وبشكل منظم وبوحدات SI. " +
      "إذا mode=hint أعط تلميحًا قصيرًا بدون حل كامل. " +
      "إذا mode=solve أعط: المعطيات → القانون → التعويض → الناتج النهائي مع الوحدة + شرح مختصر.";

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions,
        input: `mode=${mode || "solve"}\nالسؤال:\n${question}`,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }

    const data = await resp.json();
    const answer = data.output_text || "لم أستطع توليد إجابة.";

    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
