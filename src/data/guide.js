// The explainer content. Kept as data so it can be translated and edited without
// touching the component. Every section ends with a concrete "how to choose".
//
// Shape: { id, title, body: [paragraphs], howToChoose }

export const GUIDE = {
  en: [
    {
      id: "how",
      title: "How this app works",
      body: [
        "You log each set as you do it: the weight, the reps, and optionally how many reps you had left in the tank. Ticking a set is what records it.",
        "From that, the app works out what you should do next time for each exercise, and tells you in one line at the top of the exercise card. You never have to decide on your own whether to add weight.",
        "Everything is stored on this phone only. There is no account and no server, so keep a backup (Settings → Data & backup).",
      ],
      howToChoose: "Just train and tick your sets. The rest of this page explains the words you'll see.",
    },
    {
      id: "day",
      title: "Reading a workout day",
      body: [
        "The ring at the top is how much of today's workout is done. A day finishes itself when every exercise is ticked — you don't have to press anything, though 'Complete Workout' is there if you want to close a day early.",
        "Each exercise has a coloured dot: green means last session was clean, so push on today. Amber means repeat what you did — either you didn't finish all the sets, or it got harder rather than better. Grey means there isn't enough comparable history yet.",
        "Days can also be Skipped (with a reason), Assumed done (back-filled when you set up), or In progress if you started but didn't finish.",
      ],
      howToChoose: "Green → follow the prompt. Amber → repeat the same weight and reps. Grey → just train and log it.",
    },
    {
      id: "warmup",
      title: "Warm-up sets vs working sets",
      body: [
        "S1, S2, S3 are your working sets — the real ones. '+ Warm-up set' adds a lighter build-up set, shown dashed.",
        "Warm-up sets are recorded but never counted: they can't set a personal record, they don't add to your weekly volume, they never trigger or block a progression prompt, and they don't appear on the progress charts.",
      ],
      howToChoose: "Log warm-ups if you want the record of them. Leave them out if you'd rather keep the screen simple — nothing depends on them.",
    },
    {
      id: "rir",
      title: "RIR — reps in reserve",
      body: [
        "RIR is how many more reps you could have done before failing. RIR 2 means you stopped with about two left. RIR 0 means you went to failure.",
        "It matters because adding weight only counts as progress if the effort stayed the same. If you lift more but grind much harder for it, that isn't the same kind of improvement — the app labels that 'effort-driven' instead of treating it as a clean step forward.",
        "The default target is 1–3. Logging RIR is optional; you can turn the field off in Settings.",
      ],
      howToChoose: "Be honest rather than flattering. If the bar slowed right down on the last rep, that's RIR 0–1. If you could clearly have done three more, that's RIR 3.",
    },
    {
      id: "lever",
      title: "Progression lever",
      body: [
        "The lever is what the app asks you to increase. 'Double' is the default and the one most people want: fill your rep range first, then add weight and drop back to the bottom of the range.",
        "'Load only' always asks for more weight. 'Reps only' never asks for weight. 'Sets' asks for an extra set. 'Effort' asks you to push closer to failure instead of changing the numbers.",
        "It's set per exercise, and changing it is stamped on that exercise's timeline so you can see later why the numbers moved.",
      ],
      howToChoose: "Leave it on Double unless you have a reason. Pick Load only when strength is the goal on a big lift. Pick Reps only if a joint is grumpy and you'd rather not add weight yet.",
    },
    {
      id: "range",
      title: "Rep range and load step",
      body: [
        "The rep range (8–12 by default) is the window you work inside. You climb from the bottom to the top by adding reps, then add weight and start again at the bottom.",
        "The load step is how much weight gets added when you get there, and it's also what the − and + buttons beside each weight change. Lower-body lifts default to 5 kg, upper-body to 2.5 kg, because the same jump is a much smaller share of a heavy squat than of a lateral raise.",
      ],
      howToChoose: "Lower the step if the next jump feels too big — 1.25 kg is fine for small exercises. Use a lower range (5–8) for heavy strength work, a higher one (12–15) for small muscles like calves and side delts.",
    },
    {
      id: "recovery",
      title: "The weekly recovery check-in",
      body: [
        "Once a week the app asks how recovered you feel, 1 to 5. 1 is beat up, 5 is fresh.",
        "If you answer 1 or 2, the app holds every weight where it is for that week and tells you why on the exercise card. It doesn't quietly stop suggesting things — it says 'fatigue logged low — hold loads this week'.",
        "You can write your own note about what to do in that situation in Settings.",
      ],
      howToChoose: "Answer for the week as a whole, not one bad night's sleep. Persistent soreness, poor sleep and dread of training are a 1–2. Normal tiredness is a 3.",
    },
    {
      id: "volume",
      title: "Target sets per muscle",
      body: [
        "The dashboard counts how many hard sets each muscle got this week. A set counts 1.0 for the muscle it mainly trains and 0.5 for the ones it helps — so a chest press gives chest 1.0 and triceps 0.5.",
        "The default target is 10–20 sets per muscle per week, shown as a band behind the bars.",
        "Two warnings can appear: 'under-stimulated' when a muscle has been below the band two weeks running, and 'volume jump' when it rose more than 20% in a week, which is where niggles tend to come from.",
      ],
      howToChoose: "Start at the bottom of the band and add sets only when recovery is good. More is not better once you're inside the band — it just costs more recovery.",
    },
    {
      id: "age",
      title: "Training age",
      body: [
        "This tells the app how fast to expect progress, and how insistent to be about it.",
        "Novice: under roughly a year of consistent training. You can add weight most sessions, so the app expects that and flags a stall quickly.",
        "Intermediate: roughly one to three years. Progress comes weekly to monthly, so a flat session or two is normal.",
        "Advanced: several years of consistent training near your potential. Progress can take months, so the app stops nagging and treats a flat month as normal rather than a problem.",
      ],
      howToChoose: "Judge by consistent training, not by time since your first gym visit. If unsure, pick the lower one — you'll simply be asked to progress more often, and you can change it any time.",
    },
    {
      id: "deload",
      title: "Deload weeks",
      body: [
        "Every 6th week is marked as a deload — a lighter week to let fatigue drain off. You can make any week a deload, or turn one back into a normal week, from the buttons on the day screen.",
        "In a deload week the app asks for no progression, records no personal records, and doesn't count those sessions when looking for a stall. They still count towards your streak and completion — a deload is training, not a day off.",
      ],
      howToChoose: "Keep the same exercises, drop the weight roughly 10% or cut a set or two, and stop well short of failure.",
    },
    {
      id: "stall",
      title: "When an exercise stalls",
      body: [
        "If your best set hasn't improved across three comparable sessions, the exercise is flagged as stalled and offers three ways out.",
        "Deload it ~10% and rebuild: back off and run the weight back up. Change the rep range: often the simplest fix. Swap the variation: a different version of the same movement.",
        "Whichever you pick is recorded on the exercise's timeline, so months later you can see why the numbers changed.",
      ],
      howToChoose: "Deload first if you've been grinding. Change the range if the weight is heavy but the reps won't move. Swap the exercise if it's uncomfortable rather than just hard.",
    },
    {
      id: "comparable",
      title: "Substitutions and 'not comparable'",
      body: [
        "If you did something different — a cable instead of a band, a different machine, much longer rests — write it in the 'Did something different?' box.",
        "That session stays in your history but is marked 'not comparable': it can't set a personal record, can't trigger a progression prompt, and doesn't appear on the progress charts.",
        "This is deliberate. Comparing a cable row to a barbell row would make the numbers meaningless.",
      ],
      howToChoose: "Write a note whenever the exercise wasn't really the same. It costs you nothing — the work is still logged and still counts towards your volume.",
    },
    {
      id: "pr",
      title: "Records and estimated 1RM",
      body: [
        "A personal record is the heaviest comparable working set you've done on an exercise. Warm-ups, substituted sessions and deload weeks are never counted.",
        "The history sheet can also show an estimated one-rep max using the Epley formula: weight × (1 + reps ÷ 30). It's a way to compare a set of 5 with a set of 10.",
        "It's an estimate, and it gets unreliable above about 10 reps — a set of 20 will suggest a 1RM you almost certainly can't lift.",
      ],
      howToChoose: "Use the top-set chart for day-to-day progress and the estimate only to compare sessions with different rep counts.",
    },
    {
      id: "dates",
      title: "Start date, weeks and back-filling",
      body: [
        "Your start date is the day your programme began. Days before it aren't part of the programme: they're never counted and you're never asked about them.",
        "The week number is separate — it's what the app calls the week you're in. If it's wrong, 'Where am I now?' in Settings fixes it without punishing you for weeks it wasn't tracking.",
        "Back-filling marks earlier days as 'assumed done'. They count towards completion but add nothing to your volume or gym-time totals, because no sets were actually logged. Reopening such a day clears that flag so anything you type in counts properly.",
      ],
      howToChoose: "Set the start date to the day you actually began. Only back-fill if you really did train those days.",
    },
    {
      id: "backup",
      title: "Backups",
      body: [
        "Everything lives in this browser. Clearing site data, or losing the phone, loses your training history.",
        "Settings → Data & backup exports a single file with everything in it. Importing asks whether to merge it with what's here or replace everything.",
        "The app nudges you to back up each time a week closes, and it will warn you loudly if a save ever fails.",
      ],
      howToChoose: "Export whenever the app asks, and keep the file somewhere that syncs off the phone.",
    },
  ],

  ar: [
    {
      id: "how",
      title: "كيف يعمل التطبيق",
      body: [
        "تسجلين كل جولة وقت ما تسوينها: الوزن، التكرارات، واختيارياً كم تكرار بقي عندك. الضغط على علامة الجولة هو اللي يسجلها.",
        "من هذي البيانات يحسب التطبيق وش تسوين المرة الجاية في كل تمرين، ويكتبها لك بسطر واحد فوق التمرين. ما تحتاجين تقررين بنفسك متى تزيدين وزن.",
        "كل شيء محفوظ على هذا الجوال فقط — لا حساب ولا سيرفر، فاحتفظي بنسخة احتياطية من الإعدادات.",
      ],
      howToChoose: "درّبي وسجلي جولاتك فقط. بقية الصفحة تشرح المصطلحات اللي بتشوفينها.",
    },
    {
      id: "day",
      title: "قراءة يوم التمرين",
      body: [
        "الدائرة فوق تبيّن كم أنجزتِ من تمرين اليوم. اليوم يكتمل تلقائياً لما تخلصين كل التمارين — ما يحتاج تضغطين شيء، وزر «إكمال التمرين» موجود لو حبيتِ تقفلين اليوم بدري.",
        "كل تمرين له نقطة ملونة: الأخضر يعني الجلسة الماضية كانت نظيفة فتقدّمي اليوم. الكهرماني يعني كرري نفس الشي — إما ما كملتِ الجولات أو صار أصعب بدل ما يتحسن. الرمادي يعني ما فيه بيانات كافية للمقارنة.",
        "الأيام ممكن تكون متخطاة (مع سبب)، أو مفترض إنجازها، أو جارية إذا بدأتِ وما كملتِ.",
      ],
      howToChoose: "أخضر ← اتبعي التوصية. كهرماني ← كرري نفس الوزن والتكرارات. رمادي ← درّبي وسجلي فقط.",
    },
    {
      id: "warmup",
      title: "جولات الإحماء مقابل جولات العمل",
      body: [
        "S1 و S2 و S3 هي جولات العمل الحقيقية. زر «+ جولة إحماء» يضيف جولة أخف تظهر بخط متقطع.",
        "جولات الإحماء تُسجّل لكنها لا تُحسب أبداً: لا تصنع رقماً قياسياً، ولا تضاف لحجم أسبوعك، ولا تُشغّل أو تمنع توصية التقدم، ولا تظهر في الرسوم البيانية.",
      ],
      howToChoose: "سجّليها لو تحبين الاحتفاظ بها، واتركيها لو تفضلين شاشة أبسط — لا شيء يعتمد عليها.",
    },
    {
      id: "rir",
      title: "RIR — التكرارات المتبقية",
      body: [
        "RIR هو كم تكرار كان باستطاعتك عمله قبل الفشل. RIR 2 يعني وقفتِ وباقي تقريباً تكرارين. RIR 0 يعني وصلتِ للفشل.",
        "أهميته أن زيادة الوزن ما تُحسب تقدماً إلا إذا بقي المجهود نفسه. لو رفعتِ أثقل لكن بمعاناة أكبر بكثير، فهذا نوع مختلف من التحسن — والتطبيق يسميه «تحسن بالمجهود» بدل ما يعتبره خطوة نظيفة للأمام.",
        "الهدف الافتراضي 1–3، وتسجيل RIR اختياري ويمكن إيقافه من الإعدادات.",
      ],
      howToChoose: "كوني صادقة مع نفسك. لو بطأ التكرار الأخير كثيراً فهذا RIR 0–1، ولو كان واضح إنك تقدرين ثلاثة زيادة فهذا RIR 3.",
    },
    {
      id: "lever",
      title: "محرك التقدم",
      body: [
        "المحرك هو الشيء اللي يطلب منك التطبيق تزيدينه. «مزدوج» هو الافتراضي والأنسب لأغلب الناس: املئي نطاق التكرارات أولاً، ثم زيدي الوزن وارجعي لأسفل النطاق.",
        "«الوزن فقط» يطلب وزناً أكثر دائماً. «التكرارات فقط» لا يطلب وزناً أبداً. «الجولات» يطلب جولة إضافية. «المجهود» يطلب الاقتراب أكثر من الفشل بدل تغيير الأرقام.",
        "يُضبط لكل تمرين على حدة، وأي تغيير يُسجّل في سجل التمرين لتعرفي لاحقاً لماذا تغيّرت الأرقام.",
      ],
      howToChoose: "اتركيه «مزدوج» إلا لسبب. اختاري «الوزن فقط» لو الهدف قوة قصوى في حركة كبيرة، و«التكرارات فقط» لو في مفصل متضايق وما تبين تزيدين وزن الآن.",
    },
    {
      id: "range",
      title: "نطاق التكرارات وخطوة الوزن",
      body: [
        "نطاق التكرارات (8–12 افتراضياً) هو المدى اللي تشتغلين داخله: تصعدين من الأسفل للأعلى بزيادة التكرارات، ثم تزيدين الوزن وترجعين للأسفل.",
        "خطوة الوزن هي مقدار الزيادة، وهي نفسها اللي تتغير بأزرار − و + جنب كل وزن. تمارين الجزء السفلي افتراضياً 5 كجم والعلوي 2.5 كجم، لأن نفس الزيادة نسبتها أصغر بكثير في سكوات ثقيل منها في رفرفة جانبية.",
      ],
      howToChoose: "قللي الخطوة لو الزيادة القادمة تبدو كبيرة — 1.25 كجم مناسبة للتمارين الصغيرة. استخدمي نطاقاً أقل (5–8) لعمل القوة الثقيل، وأعلى (12–15) للعضلات الصغيرة مثل البطات والكتف الجانبي.",
    },
    {
      id: "recovery",
      title: "تقييم الاستشفاء الأسبوعي",
      body: [
        "مرة في الأسبوع يسألك التطبيق عن استشفائك من 1 إلى 5. 1 يعني متعبة جداً و5 يعني نشيطة.",
        "لو جاوبتِ 1 أو 2 يثبّت التطبيق كل الأوزان ذلك الأسبوع ويكتب السبب على بطاقة التمرين. ما يوقف التوصيات بصمت — بل يقول «الاستشفاء منخفض — ثبتي الأوزان هذا الأسبوع».",
        "ويمكنك كتابة ملاحظتك الخاصة عما تفعلينه في هذي الحالة من الإعدادات.",
      ],
      howToChoose: "قيّمي الأسبوع ككل لا ليلة نوم سيئة. الألم المستمر وقلة النوم وكره التمرين تعني 1–2، والتعب الطبيعي يعني 3.",
    },
    {
      id: "volume",
      title: "الجولات المستهدفة لكل عضلة",
      body: [
        "تحسب لوحة التحكم كم جولة جادة أخذتها كل عضلة هذا الأسبوع: الجولة تُحسب 1.0 للعضلة الأساسية و0.5 للعضلات المساعدة — فتمرين الصدر يعطي الصدر 1.0 والترايسبس 0.5.",
        "الهدف الافتراضي 10–20 جولة لكل عضلة أسبوعياً، ويظهر كنطاق خلف الأعمدة.",
        "وقد يظهر تحذيران: «تحفيز ناقص» إذا بقيت العضلة تحت النطاق أسبوعين متتاليين، و«قفزة حجم» إذا ارتفعت أكثر من 20٪ في أسبوع — ومن هنا تجي الإصابات الصغيرة عادة.",
      ],
      howToChoose: "ابدئي من أسفل النطاق وزيدي فقط لما يكون الاستشفاء جيداً. الأكثر ليس أفضل داخل النطاق — فقط يكلف استشفاءً أكثر.",
    },
    {
      id: "age",
      title: "مستوى الخبرة",
      body: [
        "يخبر التطبيق كم يتوقع أن يكون تقدمك سريعاً، وكم يكون ملحاً في طلبه.",
        "مبتدئة: أقل من سنة تقريباً من التدريب المنتظم. تقدرين تزيدين وزناً في أغلب الجلسات، فيتوقع التطبيق ذلك ويرفع علم التوقف بسرعة.",
        "متوسطة: من سنة إلى ثلاث سنوات تقريباً. التقدم أسبوعي إلى شهري، فجلسة أو جلستان ثابتتان أمر طبيعي.",
        "متقدمة: سنوات من التدريب المنتظم قرب سقف إمكاناتك. التقدم قد يأخذ شهوراً، فيتوقف التطبيق عن الإلحاح ويعتبر الشهر الثابت طبيعياً لا مشكلة.",
      ],
      howToChoose: "احسبي التدريب المنتظم لا الوقت منذ أول زيارة للنادي. لو مترددة اختاري الأقل — سيُطلب منك التقدم أكثر فقط، ويمكن تغييره في أي وقت.",
    },
    {
      id: "deload",
      title: "أسابيع الديلود",
      body: [
        "كل أسبوع سادس يُعلّم كأسبوع ديلود — أسبوع أخف لتصريف التعب. ويمكنك جعل أي أسبوع ديلود أو إرجاعه عادياً من أزرار شاشة اليوم.",
        "في أسبوع الديلود لا يطلب التطبيق أي تقدم، ولا يسجل أرقاماً قياسية، ولا يحسب تلك الجلسات عند البحث عن توقف. لكنها تُحسب في سلسلة أيامك وإنجازك — الديلود تدريب وليس إجازة.",
      ],
      howToChoose: "احتفظي بنفس التمارين، وخففي الوزن حوالي 10٪ أو احذفي جولة أو جولتين، وابتعدي عن الفشل.",
    },
    {
      id: "stall",
      title: "لما يتوقف تمرين",
      body: [
        "إذا لم تتحسن أفضل جولة لك عبر ثلاث جلسات قابلة للمقارنة، يُعلّم التمرين كمتوقف ويعرض ثلاثة حلول.",
        "خففي 10٪ وابني من جديد، أو غيّري نطاق التكرارات وهو غالباً أبسط حل، أو بدّلي نسخة الحركة.",
        "وأياً كان اختيارك يُسجّل في سجل التمرين لتعرفي بعد شهور لماذا تغيّرت الأرقام.",
      ],
      howToChoose: "خففي أولاً لو كنتِ تعانين. غيّري النطاق لو الوزن ثقيل والتكرارات ما تتحرك. بدّلي الحركة لو كانت مزعجة لا مجرد صعبة.",
    },
    {
      id: "comparable",
      title: "التبديل و«غير قابلة للمقارنة»",
      body: [
        "لو سويتِ شيئاً مختلفاً — كيبل بدل الباند، جهاز مختلف، راحات أطول بكثير — اكتبيه في خانة «سويتي شي مختلف؟».",
        "تبقى الجلسة في سجلك لكن تُعلّم «غير قابلة للمقارنة»: لا تصنع رقماً قياسياً، ولا تُشغّل توصية تقدم، ولا تظهر في الرسوم البيانية.",
        "وهذا مقصود، لأن مقارنة سحب الكيبل بسحب البار تجعل الأرقام بلا معنى.",
      ],
      howToChoose: "اكتبي ملاحظة كلما لم يكن التمرين هو نفسه فعلاً. لا تخسرين شيئاً — العمل مسجّل ويُحسب في حجمك.",
    },
    {
      id: "pr",
      title: "الأرقام القياسية وتقدير 1RM",
      body: [
        "الرقم القياسي هو أثقل جولة عمل قابلة للمقارنة سويتيها في التمرين. الإحماء والجلسات المُبدّلة وأسابيع الديلود لا تُحسب أبداً.",
        "وتستطيع صفحة السجل عرض تقدير أقصى وزن لتكرار واحد بمعادلة Epley: الوزن × (١ + التكرارات ÷ ٣٠)، وهي طريقة لمقارنة جولة من 5 تكرارات بجولة من 10.",
        "لكنه تقدير يصبح غير موثوق فوق 10 تكرارات تقريباً — جولة من 20 ستقترح رقماً شبه مؤكد أنك لا ترفعينه.",
      ],
      howToChoose: "استخدمي رسم أفضل جولة للتقدم اليومي، والتقدير فقط لمقارنة جلسات بأعداد تكرارات مختلفة.",
    },
    {
      id: "dates",
      title: "تاريخ البداية والأسابيع والملء الرجعي",
      body: [
        "تاريخ البداية هو يوم بدء برنامجك. الأيام قبله ليست جزءاً من البرنامج: لا تُحسب أبداً ولا يُسأل عنها.",
        "رقم الأسبوع منفصل — هو ما يسميه التطبيق الأسبوع الحالي. ولو كان خطأ فزر «وين وصلت؟» في الإعدادات يصححه دون معاقبتك على أسابيع لم يكن يتابعها.",
        "الملء الرجعي يعلّم الأيام السابقة كـ«مفترض إنجازها»: تُحسب في الإنجاز لكنها لا تضيف شيئاً لحجمك أو وقت النادي لأنه لم تُسجّل جولات فعلية. وإعادة فتح مثل هذا اليوم تزيل العلامة فيُحسب ما تكتبينه بشكل صحيح.",
      ],
      howToChoose: "اضبطي تاريخ البداية على اليوم الذي بدأتِ فيه فعلاً، ولا تستخدمي الملء الرجعي إلا إذا تدربتِ تلك الأيام حقاً.",
    },
    {
      id: "backup",
      title: "النسخ الاحتياطي",
      body: [
        "كل شيء محفوظ في هذا المتصفح. مسح بيانات الموقع أو ضياع الجوال يعني ضياع سجل تدريبك.",
        "من الإعدادات ← البيانات والنسخ الاحتياطي تصدّرين ملفاً واحداً فيه كل شيء، وعند الاستيراد يسألك: دمج مع الموجود أم استبدال الكل.",
        "ويذكّرك التطبيق بأخذ نسخة كلما اكتمل أسبوع، وينبهك بوضوح لو فشل الحفظ.",
      ],
      howToChoose: "صدّري كلما طلب منك التطبيق، واحفظي الملف في مكان يتزامن خارج الجوال.",
    },
  ],
};
