// Site chrome strings (nav, buttons, labels) - separate from guide/data
// *content*, which lives in src/content/ and is translated by
// scripts/translate.mjs. Only en/he are filled in; other locales fall back
// to English until someone prioritizes translating the UI itself for them.

export const ui = {
  en: {
    nav: { guides: 'Guides', data: 'Data', submit: 'Submit' },
    footer: { tagline: "Non-Obsolescence — fix it, don't toss it." },
    home: {
      heroTitle: "Fix it. Don't toss it.",
      heroSubtitle:
        'Free, community-built repair and building guides — plus data on which products are actually worth fixing, and which materials are worth building with.',
      featuredGuides: 'Featured Guides',
      noFeatured: 'No featured guides yet.'
    },
    guides: {
      title: 'All Guides',
      empty: 'No guides yet in this language.',
      allCategories: 'All categories',
      searchPlaceholder: 'Search guides…'
    },
    guideDetail: { toolsNeeded: 'Tools needed', by: 'by', step: 'Step' },
    linkList: { videos: 'Videos', parts: 'Where to get parts' },
    draftBanner: {
      text: "This page is a machine-translated draft and hasn't been checked by a human yet.",
      helpReview: 'Help review this translation'
    },
    data: {
      title: 'Repairability & Materials Data',
      subtitle:
        'Which products are actually worth fixing, and which materials are worth building with. Placeholder data for now — the scoring rubric and sourcing methodology still need to be written.',
      fixabilityHeading: 'Fixability by Brand',
      materialsHeading: 'Materials Reference',
      durability: 'Durability',
      recyclability: 'Recyclability',
      allCategories: 'All categories',
      searchFixabilityPlaceholder: 'Search brands…',
      searchMaterialsPlaceholder: 'Search materials…',
      noResults: 'Nothing matches that filter.'
    },
    submit: {
      title: 'Submit a Guide',
      intro:
        "No account needed. This goes straight into our review queue — someone checks it, and if it's approved it becomes a real guide page. If it isn't, we'll tell you why.",
      titleLabel: 'Guide title',
      titlePlaceholder: 'How to Replace a Laptop Battery',
      productLabel: 'Product / product type',
      categoryLabel: 'Category',
      categoryPlaceholder: 'Home & Electrical',
      difficultyLabel: 'Difficulty',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      estimatedTimeLabel: 'Estimated time',
      estimatedTimePlaceholder: '20 minutes',
      toolsLabel: 'Tools needed',
      toolsPlaceholder: 'One per line',
      coverPhotoLabel: 'Cover photo',
      coverPhotoHelp: 'JPG, PNG, WebP or GIF, up to 5MB.',
      stepsLabel: 'Steps',
      addStep: '+ Add step',
      stepPlaceholder: 'What do you do in this step?',
      stepImageTitle: 'Photo for this step (optional, up to 5MB)',
      stepPartPlaceholder: 'Part link: Label | URL (optional)',
      stepVideoPlaceholder: 'Video link: Label | URL (optional)',
      remove: 'Remove',
      stepNumber: 'Step',
      partLinksLabel: 'Part links',
      videoLinksLabel: 'Video links',
      linksPlaceholder: 'One per line: Label | https://...',
      notesLabel: 'Safety notes, disposal notes, anything else',
      authorLabel: 'Your name (for credit)',
      submitButton: 'Submit for review',
      githubPrompt: 'Have a GitHub account and prefer to use it directly?',
      githubLink: 'Open the submission there instead',
      submitting: 'Submitting…',
      submitted: 'Submitted! Thank you — you can follow its review here.',
      viewSubmission: 'View submission',
      genericError: 'Something went wrong. Please try again.',
      networkError: 'Network error — please try again.'
    }
  },
  he: {
    nav: { guides: 'מדריכים', data: 'נתונים', submit: 'הגשה' },
    footer: { tagline: 'לא-מתיישן — לתקן במקום לזרוק.' },
    home: {
      heroTitle: 'לתקן. לא לזרוק.',
      heroSubtitle:
        'מדריכי תיקון ובנייה חינמיים בבניית הקהילה — בתוספת נתונים על אילו מוצרים באמת שווה לתקן, ומאילו חומרים כדאי לבנות.',
      featuredGuides: 'מדריכים נבחרים',
      noFeatured: 'עדיין אין מדריכים נבחרים.'
    },
    guides: {
      title: 'כל המדריכים',
      empty: 'עדיין אין מדריכים בשפה הזו.',
      allCategories: 'כל הקטגוריות',
      searchPlaceholder: 'חיפוש מדריכים…'
    },
    guideDetail: { toolsNeeded: 'כלים נדרשים', by: 'מאת', step: 'שלב' },
    linkList: { videos: 'סרטונים', parts: 'איפה להשיג חלקים' },
    draftBanner: {
      text: 'זהו תרגום אוטומטי טיוטה שעדיין לא נבדק על ידי אדם.',
      helpReview: 'עזרו לבדוק את התרגום'
    },
    data: {
      title: 'נתוני יכולת תיקון וחומרים',
      subtitle:
        'אילו מוצרים באמת שווה לתקן, ומאילו חומרים כדאי לבנות. נתוני דוגמה בינתיים — שיטת הניקוד ומקורות המידע עוד לא נכתבו.',
      fixabilityHeading: 'יכולת תיקון לפי מותג',
      materialsHeading: 'מדריך חומרים',
      durability: 'עמידות',
      recyclability: 'מחזוריות',
      allCategories: 'כל הקטגוריות',
      searchFixabilityPlaceholder: 'חיפוש מותגים…',
      searchMaterialsPlaceholder: 'חיפוש חומרים…',
      noResults: 'שום דבר לא תואם את הסינון הזה.'
    },
    submit: {
      title: 'הגישו מדריך',
      intro:
        'אין צורך בחשבון. ההגשה עוברת ישירות לתור הבדיקה שלנו — מישהו יבדוק אותה, ואם תאושר היא תהפוך לעמוד מדריך אמיתי. אם לא, נסביר למה.',
      titleLabel: 'כותרת המדריך',
      titlePlaceholder: 'איך להחליף סוללה במחשב נייד',
      productLabel: 'מוצר / סוג המוצר',
      categoryLabel: 'קטגוריה',
      categoryPlaceholder: 'בית וחשמל',
      difficultyLabel: 'רמת קושי',
      beginner: 'מתחילים',
      intermediate: 'בינוני',
      advanced: 'מתקדם',
      estimatedTimeLabel: 'זמן משוער',
      estimatedTimePlaceholder: '20 דקות',
      toolsLabel: 'כלים נדרשים',
      toolsPlaceholder: 'שורה לכל כלי',
      coverPhotoLabel: 'תמונת שער',
      coverPhotoHelp: 'JPG, PNG, WebP או GIF, עד 5MB.',
      stepsLabel: 'שלבים',
      addStep: '+ הוספת שלב',
      stepPlaceholder: 'מה עושים בשלב הזה?',
      stepImageTitle: 'תמונה לשלב הזה (אופציונלי, עד 5MB)',
      stepPartPlaceholder: 'קישור לחלק: תווית | כתובת (אופציונלי)',
      stepVideoPlaceholder: 'קישור לסרטון: תווית | כתובת (אופציונלי)',
      remove: 'הסרה',
      stepNumber: 'שלב',
      partLinksLabel: 'קישורים לחלקים',
      videoLinksLabel: 'קישורים לסרטונים',
      linksPlaceholder: 'שורה לכל קישור: תווית | https://...',
      notesLabel: 'הערות בטיחות, סילוק, או כל דבר נוסף',
      authorLabel: 'השם שלך (לקרדיט)',
      submitButton: 'שליחה לבדיקה',
      githubPrompt: 'יש לכם חשבון GitHub ומעדיפים להשתמש בו ישירות?',
      githubLink: 'פתחו את ההגשה שם במקום',
      submitting: 'שולח…',
      submitted: 'נשלח! תודה — ניתן לעקוב אחרי הבדיקה כאן.',
      viewSubmission: 'צפייה בהגשה',
      genericError: 'משהו השתבש. נסו שוב.',
      networkError: 'שגיאת רשת — נסו שוב.'
    }
  }
} as const;

export type Locale = keyof typeof ui;

export function t(locale: string) {
  const dict = (ui as Record<string, (typeof ui)['en']>)[locale] ?? ui.en;
  return {
    nav: { ...ui.en.nav, ...dict.nav },
    footer: { ...ui.en.footer, ...dict.footer },
    home: { ...ui.en.home, ...dict.home },
    guides: { ...ui.en.guides, ...dict.guides },
    guideDetail: { ...ui.en.guideDetail, ...dict.guideDetail },
    linkList: { ...ui.en.linkList, ...dict.linkList },
    draftBanner: { ...ui.en.draftBanner, ...dict.draftBanner },
    data: { ...ui.en.data, ...dict.data },
    submit: { ...ui.en.submit, ...dict.submit }
  };
}
