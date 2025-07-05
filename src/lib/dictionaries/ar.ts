import type { Dictionary } from "./en";

export const arStrings: Dictionary = {
  header: {
    title: "أكاديمية الميدان لكرة القدم",
    bookField: "احجز ملعب",
    myBookings: "حجوزاتي",
    admin: "الإدارة",
  },
  footer: {
    copyright: "© {year} أكاديمية الميدان لكرة القدم. جميع الحقوق محفوظة.",
  },
  bookingPage: {
    title: "احجز ملعبك",
    description: "اتبع الخطوات البسيطة أدناه لحجز ملعب كرة القدم الخاص بك في أكاديمية الميدان.",
    selectDate: "اختر تاريخًا",
    selectDateDesc: "انقر على تاريخ لرؤية الأوقات المتاحة.",
  },
  timeSlotPicker: {
    title: "اختر فترة زمنية",
    description: "اختر مدة زمنية ووقتًا متاحًا لحجزك في {date}.",
    durationLabel: "مدة الحجز",
    durationPlaceholder: "اختر المدة",
    oneHour: "ساعة واحدة",
    twoHours: "ساعتان",
  },
  bookingForm: {
    title: "أدخل بياناتك",
    bookingFor: "الحجز بتاريخ {date} في الساعة {time} لمدة {duration} ساعة (ساعات).",
    nameLabel: "الاسم الكامل",
    namePlaceholder: "مثال: جون دو",
    phoneLabel: "رقم الهاتف",
    phonePlaceholder: "مثال: 555-1234",
    termsLabel: "أوافق على الشروط والأحكام",
    confirmButton: "تأكيد الحجز",
    validation: {
      nameMin: "يجب أن يتكون الاسم من حرفين على الأقل.",
      phoneFormat: "يجب أن يكون رقم الهاتف بالتنسيق XXX-XXXX.",
      termsRequired: "يجب عليك قبول الشروط والأحكام.",
    },
  },
  bookingsPage: {
    title: "حجوزاتي",
    description: "هذه قائمة بجميع حجوزاتك القادمة في أكاديمية الميدان.",
  },
  bookingHistoryTable: {
    date: "التاريخ",
    time: "الوقت",
    duration: "المدة",
    name: "الاسم",
    status: "الحالة",
    upcoming: "قادم",
    noBookings: "ليس لديك حجوزات قادمة.",
    durationValue: "{duration} ساعة (ساعات)",
  },
  adminPage: {
    title: "مساعد الجدولة الذكي",
    description: "استخدم أداتنا المدعومة بالذكاء الاصطناعي لتحليل أنماط الحجز وتلقي توصيات للجدولة المثلى لزيادة استخدام المنشأة.",
    dataCardTitle: "بيانات الحجز",
    dataCardDescription: "أدخل بيانات الحجز التاريخية بتنسيق JSON. يمكنك استخدام بيانات الحجز الحالية للتطبيق كمثال.",
    dataPlaceholder: "الصق بيانات الحجز هنا...",
    analyzeButton: "تحليل الأنماط",
    analyzingButton: "جارٍ التحليل...",
    useMockButton: "استخدام بيانات حجز التطبيق",
    errorTitle: "خطأ",
    recommendationsTitle: "توصيات الجدولة",
    errorEmpty: "تعذر الحصول على توصيات. كانت النتيجة فارغة.",
    errorAnalyzing: "حدث خطأ أثناء تحليل بيانات الحجز.",
  },
  toasts: {
    bookingConfirmedTitle: "تم تأكيد الحجز!",
    bookingConfirmedDesc: "تم تأكيد حجزك بتاريخ {date} في الساعة {time}.",
  }
};
