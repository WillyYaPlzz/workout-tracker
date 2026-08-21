// Program content: the 4 workouts, warm-up/cool-down checklists, and per-exercise
// training config used by the progressive-overload engine.
//
// Per-exercise fields:
//   muscles.primary / muscles.secondary — for weekly sets-per-muscle counting (direct 1.0, indirect 0.5)
//   repRangeMin/repRangeMax             — double-progression rep range
//   loadIncrement                       — kg per load step (5 on lower-body lifts, 2.5 elsewhere)
//   restSec                             — default rest between sets
//   type                                — "reps" today; "timed"/"count" reserved for future programs
//   supersetGroup/optional/choiceSlot   — reserved for future programs (no UI yet)

export const WARMUP = {
  upper: { link: "https://youtube.com/shorts/uU47qraVnUM", items: { en: ["3-5 min light cardio","Arm circles (30 sec each direction)","Band pull-aparts (15 repsx2)","Over head Band pull-aparts (15 repsx2)","Externl Rotation (10 repsx3)","Internal Rotation (10 repsx3)","Light set of first exercise"], ar: ["5 دقائق كارديو خفيف","دوران الذراعين (30 ثانية كل اتجاه)","سحب الباند (15 تكرار)","تمارين مرونة الكتف (10 تكرار)","جولة خفيفة من التمرين الأول"] } },
  legs: { link: "https://youtube.com/shorts/49yH08totkg", items: { en: ["3-5 min light cardio","Bodyweight squats (15 reps)","Leg swings (10 each leg)","Hip circles (10 each direction)","Light set of first exercise"], ar: ["5 دقائق كارديو خفيف","سكوات بوزن الجسم (15 تكرار)","تأرجح الأرجل (10 كل رجل)","دوران الورك (10 كل اتجاه)","جولة خفيفة من التمرين الأول"] } },
};

export const COOLDOWN = { items: { en: ["10-15 min low intensity cardio","Static stretches (30 sec each muscle)","Deep breathing (2 min)"], ar: ["10-15 دقيقة كارديو خفيف","تمارين إطالة ثابتة (30 ثانية لكل عضلة)","تنفس عميق (دقيقتين)"] } };

const ex = (base, extra) => ({ type: "reps", repRangeMin: 8, repRangeMax: 12, restSec: 90, loadIncrement: 2.5, ...base, ...extra });

export const WORKOUTS = {
  UB1: { name: { en: "Upper Body 1", ar: "الجزء العلوي" }, subtitle: { en: "Chest · Shoulders · Triceps", ar: "صدر · اكتاف · تراي" }, color: "#00e5ff", warmupType: "upper", exercises: [
    ex({ id: "ub1-1", name: { en: "Flat Chest Press", ar: "صدر مستوي" }, options: { en: ["Bar","Dumbbells","Machine"], ar: ["بار","دمبلز","جهاز"] }, links: ["https://youtu.be/j7sCaOJv70g","https://youtu.be/t90Vb6IBi0E","https://youtu.be/5t7V28ouaZM"], target: { en: "Mid chest", ar: "منتصف الصدر" }, muscles: { primary: ["chest"], secondary: ["front-delts","triceps"] } }),
    ex({ id: "ub1-2", name: { en: "Chest Fly", ar: "تفتيح" }, options: { en: ["Machine","Dumbbells"], ar: ["جهاز","دمبلز"] }, links: ["https://youtube.com/shorts/bmzOhtBNNe0","https://youtube.com/shorts/qTXCC-DxTn0"], target: { en: "Full chest", ar: "كامل الصدر" }, muscles: { primary: ["chest"], secondary: [] } }),
    ex({ id: "ub1-3", name: { en: "Incline Chest Press", ar: "صدر علوي" }, options: { en: ["Dumbbells","Smith","Machine"], ar: ["دمبلز","سميث","جهاز"] }, links: ["https://youtu.be/IP4oeKh1Sd4","https://youtube.com/shorts/V97zLZ_21jQ","https://youtu.be/rVh0tKDnYvs"], target: { en: "Upper chest", ar: "أعلى الصدر" }, muscles: { primary: ["chest"], secondary: ["front-delts","triceps"] } }),
    ex({ id: "ub1-4", name: { en: "Shoulder Press", ar: "تجميع كتف" }, options: { en: ["Dumbbells","Machine","Smith"], ar: ["دمبلز","جهاز","سميث"] }, links: ["https://youtube.com/shorts/0PNciMQXgBo","https://youtu.be/GcY6TZxfS0k","https://youtube.com/shorts/DcyCS15CB5A"], target: { en: "Front delt 70%, side 30%", ar: "الكتف الأمامي 70% والجانبي 30%" }, muscles: { primary: ["front-delts"], secondary: ["side-delts","triceps"] } }),
    ex({ id: "ub1-5", name: { en: "Lateral Raise", ar: "رفرفة جانبي" }, options: { en: ["Cable","Dumbbells"], ar: ["كيبل","دمبلز"] }, links: ["https://youtube.com/shorts/TbWTtxG6Iuw","https://youtube.com/shorts/qYkRsGiUyrQ"], target: { en: "Side deltoid", ar: "الكتف الجانبي" }, muscles: { primary: ["side-delts"], secondary: [] }, repRangeMin: 10, repRangeMax: 15 }),
    ex({ id: "ub1-6", name: { en: "Triceps (Long Head)", ar: "ترايسبس (رأس طويل)" }, options: { en: ["Cable","Dumbbells"], ar: ["كيبل","دمبلز"] }, links: ["https://youtube.com/shorts/92q_fdxLyp8","https://youtube.com/shorts/T3e390Dl3XU"], target: { en: "Triceps long head", ar: "الرأس الطويل من التراي" }, muscles: { primary: ["triceps"], secondary: [] } }),
    ex({ id: "ub1-7", name: { en: "Triceps (Lateral Head)", ar: "ترايسبس (رأس جانبي)" }, options: { en: ["Rope","Bar","Cable"], ar: ["روب","مسطرة","كيبل"] }, links: ["https://youtube.com/shorts/ZAXkv_sWFww","https://youtube.com/shorts/L9mJCdhWBnY","https://youtube.com/shorts/KweUYETA8RU"], target: { en: "Triceps lateral head", ar: "الرأس الجانبي من التراي" }, muscles: { primary: ["triceps"], secondary: [] } }),
  ] },
  LB1: { name: { en: "Legs 1", ar: "الأرجل" }, subtitle: { en: "Quads · Glutes · Abs", ar: "أفخاذ · قلوتس · بطن" }, color: "#ff5252", warmupType: "legs", exercises: [
    ex({ id: "lb1-1", name: { en: "Squat", ar: "سكوات" }, options: { en: ["Squat","Hack Squat"], ar: ["سكوات","هاك سكوات"] }, links: ["https://youtube.com/shorts/Lq9bf_QUSns","https://youtu.be/u_1a0nWG7vQ"], target: { en: "Front quads", ar: "الأفخاذ الأمامية" }, muscles: { primary: ["quads","glutes"], secondary: ["hamstrings","lower-back"] }, loadIncrement: 5 }),
    ex({ id: "lb1-2", name: { en: "Leg Curls", ar: "Leg Curls" }, options: { en: ["Laying","Seated","Standing"], ar: ["Laying","Seated","Standing"] }, links: ["https://youtube.com/shorts/I3MdbhUBZ1Q","https://youtube.com/shorts/OzD4NLn2W6c","https://youtube.com/shorts/i6zmbXp4Ico"], target: { en: "Hamstrings & glutes", ar: "الأفخاذ الخلفية والقلوتس" }, muscles: { primary: ["hamstrings"], secondary: ["glutes"] }, loadIncrement: 5 }),
    ex({ id: "lb1-3", name: { en: "Leg Extensions", ar: "Leg Extensions" }, options: { en: ["Machine"], ar: ["جهاز"] }, links: ["https://youtu.be/4ZDm5EbiFI8"], target: { en: "Front quads", ar: "الأفخاذ الأمامية" }, muscles: { primary: ["quads"], secondary: [] }, loadIncrement: 5 }),
    ex({ id: "lb1-4", name: { en: "Hip Adduction", ar: "Hip Adduction" }, options: { en: ["Machine"], ar: ["جهاز"] }, links: ["https://youtu.be/CjAVezAggkI"], target: { en: "Inner thigh", ar: "العضلات الداخلية للفخذ" }, muscles: { primary: ["adductors"], secondary: [] }, loadIncrement: 5 }),
    ex({ id: "lb1-5", name: { en: "Hip Abduction", ar: "Hip Abduction" }, options: { en: ["Machine"], ar: ["جهاز"] }, links: ["https://youtu.be/G_8LItOiZ0Q"], target: { en: "Glutes", ar: "القلوتس" }, muscles: { primary: ["glutes"], secondary: [] }, loadIncrement: 5 }),
    ex({ id: "lb1-6", name: { en: "Abs", ar: "بطن" }, options: { en: ["Bodyweight","Machine"], ar: ["وزن الجسم","جهاز"] }, links: ["https://youtu.be/XcK3ptDLyqg","https://youtube.com/shorts/p4ZLXSKXZec"], target: { en: "Abdominals", ar: "عضلات البطن" }, muscles: { primary: ["abs"], secondary: [] }, repRangeMin: 10, repRangeMax: 15, restSec: 60 }),
  ] },
  UB2: { name: { en: "Upper Body 2", ar: "الجزء العلوي 2" }, subtitle: { en: "Back · Rear Delts · Biceps", ar: "ظهر · اكتاف خلفية · باي" }, color: "#ffab40", warmupType: "upper", exercises: [
    ex({ id: "ub2-1", name: { en: "Lat Pulldown", ar: "Lat Pulldown" }, options: { en: ["Lat Pulldown","Pull-ups"], ar: ["Lat Pulldown","عقلة"] }, links: ["https://youtube.com/shorts/CC45F_iEvdU","https://youtube.com/shorts/HCWxQ3FAuy8"], target: { en: "Upper back & lats", ar: "الجزء العلوي من الظهر واللاتس" }, muscles: { primary: ["lats"], secondary: ["biceps","upper-back"] } }),
    ex({ id: "ub2-2", name: { en: "Seated Row", ar: "سحب أرضي" }, options: { en: ["Machine","Dumbbell"], ar: ["جهاز","دمبل"] }, links: ["https://youtube.com/shorts/3cR8rElT5sY","https://youtu.be/9vgyN3PCX1c"], target: { en: "Lats & mid back", ar: "اللاتس ومنتصف الظهر" }, muscles: { primary: ["upper-back","lats"], secondary: ["biceps","rear-delts"] } }),
    ex({ id: "ub2-3", name: { en: "Rear Delts", ar: "اكتاف خلفية" }, options: { en: ["Cable","Rope","Machine"], ar: ["كيبل","روب","جهاز"] }, links: ["https://youtube.com/shorts/iidcl0mf_4c","https://youtube.com/shorts/-SGMVsvtry4","https://youtube.com/shorts/duX8kVQDpPg"], target: { en: "Rear deltoids", ar: "الجزء الخلفي من الأكتاف" }, muscles: { primary: ["rear-delts"], secondary: ["upper-back"] }, repRangeMin: 10, repRangeMax: 15 }),
    ex({ id: "ub2-4", name: { en: "Lower Back", ar: "اسفل الظهر" }, options: { en: ["Machine"], ar: ["جهاز"] }, links: ["https://youtube.com/shorts/peFhyj7hZ6U"], target: { en: "Lower back", ar: "اسفل الظهر" }, muscles: { primary: ["lower-back"], secondary: ["glutes"] } }),
    ex({ id: "ub2-5", name: { en: "Biceps (Short Head)", ar: "بايسبس (رأس قصير)" }, options: { en: ["Machine","Dumbbells"], ar: ["جهاز","دمبلز"] }, links: ["https://youtube.com/shorts/Q3_ETmzRUvA","https://youtube.com/shorts/oHHNXMLvs1c"], target: { en: "Biceps short head", ar: "الرأس القصير للباي" }, muscles: { primary: ["biceps"], secondary: [] } }),
    ex({ id: "ub2-6", name: { en: "Biceps (Long Head)", ar: "بايسبس (رأس طويل)" }, options: { en: ["Cable","Dumbbells"], ar: ["كيبل","دمبلز"] }, links: ["https://youtube.com/shorts/frXyhWJm0zQ","https://youtube.com/shorts/4yFONULU_Oo"], target: { en: "Biceps long head", ar: "الرأس الطويل للباي" }, muscles: { primary: ["biceps"], secondary: [] } }),
  ] },
  LB2: { name: { en: "Legs 2", ar: "الأرجل 2" }, subtitle: { en: "Quads · Glutes · Calves", ar: "أفخاذ · أرداف · بطات" }, color: "#b388ff", warmupType: "legs", exercises: [
    ex({ id: "lb2-1", name: { en: "Leg Press", ar: "Leg Press" }, options: { en: ["Leg Press","Leg Press Machine"], ar: ["Leg Press","Leg Press Machine"] }, links: ["https://youtube.com/shorts/BKbL-mD53Bs","https://youtube.com/shorts/KwDFg-BuqlE"], target: { en: "Front quads & glutes", ar: "الأفخاذ الأمامية والقلوتس" }, muscles: { primary: ["quads","glutes"], secondary: ["hamstrings","adductors"] }, loadIncrement: 5 }),
    ex({ id: "lb2-2", name: { en: "Leg Curls", ar: "Leg Curls" }, options: { en: ["Laying","Seated","Standing"], ar: ["Laying","Seated","Standing"] }, links: ["https://youtube.com/shorts/I3MdbhUBZ1Q","https://youtube.com/shorts/OzD4NLn2W6c","https://youtube.com/shorts/i6zmbXp4Ico"], target: { en: "Hamstrings & glutes", ar: "الأفخاذ الخلفية والقلوتس" }, muscles: { primary: ["hamstrings"], secondary: ["glutes"] }, loadIncrement: 5 }),
    ex({ id: "lb2-3", name: { en: "Leg Extension", ar: "Leg Extension" }, options: { en: ["Machine"], ar: ["جهاز"] }, links: ["https://youtube.com/shorts/nKfLrPQD_-I"], target: { en: "Front quads", ar: "الأفخاذ الأمامية" }, muscles: { primary: ["quads"], secondary: [] }, loadIncrement: 5 }),
    ex({ id: "lb2-4", name: { en: "Glute Kickbacks", ar: "Glute Kickbacks" }, options: { en: ["Machine","Cable"], ar: ["جهاز","كيبل"] }, links: ["https://youtu.be/pnTksSV9ldc","https://youtu.be/SqO-VUEak2M"], target: { en: "Glutes", ar: "الأرداف" }, muscles: { primary: ["glutes"], secondary: ["hamstrings"] }, loadIncrement: 5 }),
    ex({ id: "lb2-5", name: { en: "Hip Thrust", ar: "Hip Thrust" }, options: { en: ["Machine","Barbell"], ar: ["Machine","Barbell"] }, links: ["https://youtube.com/shorts/V74XWj9FXAc","https://youtu.be/aweBS7K71l8"], target: { en: "Glutes", ar: "الأرداف" }, muscles: { primary: ["glutes"], secondary: ["hamstrings","quads"] }, loadIncrement: 5 }),
    ex({ id: "lb2-6", name: { en: "Calves", ar: "بطات" }, options: { en: ["Machine"], ar: ["جهاز"] }, links: ["https://youtube.com/shorts/ikbFbq-7cmk"], target: { en: "Calves", ar: "البطات" }, muscles: { primary: ["calves"], secondary: [] }, repRangeMin: 10, repRangeMax: 15, restSec: 60 }),
  ] },
};

export const WORKOUT_KEYS = ["UB1","LB1","UB2","LB2"];
export const REST = "REST";

export function getExercise(exId) {
  for (const w of Object.values(WORKOUTS)) {
    const e = w.exercises.find(x => x.id === exId);
    if (e) return e;
  }
  return null;
}

export const MUSCLES = ["chest","front-delts","side-delts","rear-delts","triceps","biceps","lats","upper-back","lower-back","quads","hamstrings","glutes","adductors","calves","abs"];
