require("dotenv").config();
const { Telegraf, session, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());

const savollar = {
  idora: "🏢 Idora:",
  technology: "📚 Texnologiya:",
  username: "🇺🇿 Telegram:",
  telefon: "📞 Aloqa:",
  hudud: "🌐 Hudud:",
  javobgar: "✍️ Mas'ul:",
  ish_vaqti: "🕰 Ish vaqti:",
  maosh: "💰 Narxi:",
  qoshimcha: "🔎 Maqsad:",
  xodim: "👨‍💼 Xodimning ism-sharifi:",
  yosh: "🕑 Yosh:",
  kasb: "👨🏻‍💻 Kasbi:",
  tajriba: "📊 Tajriba:",
  ism: "🏅 Sherik:",
  maqsad: "🎯 Maqsad:",
  loyiha: "🚀 Loyiha:",
  invest: "💵 Investitsiya:",
};

const elonTurlari = {
  "Xodim kerak": [
    "idora",
    "technology",
    "username",
    "telefon",
    "hudud",
    "javobgar",
    "ish_vaqti",
    "maosh",
    "qoshimcha",
  ],
  "Ish joyi kerak": [
    "xodim",
    "yosh",
    "technology",
    "kasb",
    "username",
    "telefon",
    "hudud",
    "maosh",
    "qoshimcha",
  ],
  "Sherik kerak": [
    "ism",
    "technology",
    "username",
    "telefon",
    "hudud",
    "maosh",
    "kasb",
    "ish_vaqti",
    "qoshimcha",
  ],
};

bot.start((ctx) => {
  ctx.reply(
    "🤖 Salom! Ushbu bot orqali e’lon berishingiz mumkin.",
    Markup.keyboard([["📢 E’lon berish"], ["📞 Admin bilan bog‘lanish"]])
      .resize()
      .oneTime()
  );
});

bot.hears("📢 E’lon berish", (ctx) => {
  ctx.reply(
    "Qaysi turdagi e’lon joylashtirmoqchisiz?",
    Markup.keyboard(Object.keys(elonTurlari).map((type) => [type])).resize()
  );
  ctx.session = { step: "elon_type" };
});

bot.hears(Object.keys(elonTurlari), (ctx) => {
  ctx.session = {
    elonType: ctx.message.text,
    data: {},
    stepIndex: 0,
  };

  const firstStep = elonTurlari[ctx.session.elonType][0];
  ctx.reply(savollar[firstStep]);
});

bot.on("text", (ctx) => {
  if (!ctx.session || !ctx.session.elonType) return;

  const elonType = ctx.session.elonType;
  const steps = elonTurlari[elonType];
  const stepIndex = ctx.session.stepIndex;

  if (stepIndex < steps.length) {
    const currentStep = steps[stepIndex];
    ctx.session.data[currentStep] = ctx.message.text;
    ctx.session.stepIndex++;

    if (ctx.session.stepIndex < steps.length) {
      const nextStep = steps[ctx.session.stepIndex];
      ctx.reply(savollar[nextStep]);
    } else {
      let elonMatni = `📢 *${elonType}*\n\n`;
      steps.forEach((step) => {
        elonMatni += `${savollar[step]} ${ctx.session.data[step]}\n`;
      });

      ctx.reply(
        `Sizning eloningiz:\n\n${elonMatni}\nTasdiqlaysizmi?`,
        Markup.inlineKeyboard([
          [Markup.button.callback("✅ Ha", "tasdiq_ha")],
          [Markup.button.callback("❌ Yo‘q", "tasdiq_yoq")],
        ])
      );
    }
  }
});

let sentMessages = {};

bot.action("tasdiq_ha", async (ctx) => {
  try {
    if (!ctx.session || !ctx.session.data) {
      return ctx.reply("❌ E’lon ma’lumotlari yo‘qoldi.");
    }

    const elonType = ctx.session.elonType;
    const steps = elonTurlari[elonType];

    let elonMatni = `📢 *${elonType}*\n\n`;

    steps.forEach((step) => {
      let value = ctx.session.data[step] || "Ma’lumot kiritilmagan";
      elonMatni += `${savollar[step]} ${value}\n`;
    });

    const sentMessage = await bot.telegram.sendMessage(
      process.env.NEW_CHANNEL_ID,
      elonMatni,
      {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback("✅ Accept", "accept")],
            [Markup.button.callback("❌ Decline", "decline")],
          ],
        },
      }
    );

    sentMessages[sentMessage.message_id] = {
      userId: ctx.from.id,
      messageId: sentMessage.message_id,
      elonType: ctx.session.elonType,
      data: ctx.session.data,
    };

    ctx.reply("✅ E’loningiz admin tasdiqlashini kutmoqda.");
    ctx.session = null;
  } catch (error) {
    console.error("Tasdiqlashda xatolik:", error);
    ctx.reply("❌ Xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.");
  }
});

bot.action("accept", async (ctx) => {
  try {
    const messageId = ctx.callbackQuery.message.message_id;

    if (sentMessages[messageId]) {
      const elon = sentMessages[messageId];
      const steps = elonTurlari[elon.elonType];

      let elonMatni = `📢 *${elon.elonType}*\n\n`;
      steps.forEach((step) => {
        let value = elon.data[step] || "Ma’lumot kiritilmagan";
        elonMatni += `${savollar[step]} ${value}\n`;
      });

      const admin = ctx.from.username
        ? `@${ctx.from.username}`
        : `${ctx.from.first_name || "Admin"}`;
      const timestamp = new Date().toLocaleString();

      try {
        await bot.telegram.deleteMessage(process.env.CHANNEL_ID, messageId);
      } catch (err) {
        console.log("Xabar o'chirilganda xatolik:", err.message);
      }

      await bot.telegram.sendMessage(
        process.env.NEW_CHANNEL_ID,
        `${elonMatni}\n\n✅ Tasdiqladi: ${admin}\n🕒 ${timestamp}`,
        { parse_mode: "Markdown" }
      );

      ctx.answerCbQuery("✅ E’lon tasdiqlandi.");
    } else {
      ctx.answerCbQuery("❌ Tasdiqlash uchun e’lon topilmadi");
    }

    delete sentMessages[messageId];
  } catch (error) {
    console.error("Tasdiqlashda xatolik:", error);
    ctx.answerCbQuery("❌ Xatolik yuz berdi.");
  }
});

bot.action("decline", async (ctx) => {
  try {
    const messageId = ctx.callbackQuery.message.message_id;

    if (sentMessages[messageId]) {
      const elon = sentMessages[messageId];

      await bot.telegram.deleteMessage(process.env.CHANNEL_ID, messageId);

      await bot.telegram.sendMessage(
        elon.userId,
        "❌ Sizning e’loningiz tasdiqlanmadi.\n\nIltimos, *qoidalar* bilan tanishing va qaytadan urinib ko‘ring.",
        { parse_mode: "Markdown" }
      );

      ctx.reply("❌ E’lon rad etildi va foydalanuvchiga xabar yuborildi.");
    } else {
      ctx.reply("❌ Rad etish uchun xabarlar mavjud emas.");
    }

    delete sentMessages[messageId];
  } catch (error) {
    console.error("Rad etishda xatolik:", error);
    ctx.reply("❌ Xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.");
  }
});

bot.action("tasdiq_yoq", (ctx) => {
  ctx.reply("E’lon bekor qilindi.");
  ctx.session = null;
});

bot.hears("📞 Admin bilan bog‘lanish", (ctx) => {
  ctx.reply("Admin bilan bog‘lanish uchun: @asadapex");
});

bot.launch();
console.log("bot ishga tushdi");
