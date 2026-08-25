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
  },
  ar: {
    nav: { guides: 'إرشادات', data: 'بيانات', submit: 'إرسال' },
    footer: { tagline: 'عدم القابلية للتقادم — أصلحه، لا تتخلص منه.' },
    home: {
      heroTitle: 'أصلحه. لا ترميه.',
      heroSubtitle:
        'إرشادات الإصلاح والبناء المجانية التي بناها المجتمع — بالإضافة إلى بيانات حول المنتجات التي تستحق الإصلاح فعلاً، والمواد التي تستحق البناء بها.',
      featuredGuides: 'الأدلة المميزة',
      noFeatured: 'لا توجد أدلة مميزة بعد.'
    },
    guides: {
      title: 'جميع الأدلة',
      empty: 'لا توجد أدلة حتى الآن بهذه اللغة.',
      allCategories: 'جميع الفئات',
      searchPlaceholder: 'ابحث عن الأدلة…'
    },
    guideDetail: { toolsNeeded: 'الأدوات المطلوبة', by: 'بواسطة', step: 'خطوة' },
    linkList: { videos: 'فيديوهات', parts: 'أين تجد القطع' },
    draftBanner: {
      text: 'هذه الصفحة مسودة مترجمة آلياً ولم تتم مراجعتها من قِبل إنسان بعد.',
      helpReview: 'ساعد في مراجعة هذه الترجمة'
    },
    data: {
      title: 'بيانات الإصلاح والمواد',
      subtitle:
        'ما المنتجات التي تستحق الإصلاح فعلاً، وما المواد التي تستحق البناء بها. بيانات مؤقتة حالياً — لا تزال منهجية التقييم والمصادر بحاجة إلى كتابة.',
      fixabilityHeading: 'قابلية الإصلاح حسب العلامة التجارية',
      materialsHeading: 'مرجع المواد',
      durability: 'المتانة',
      recyclability: 'قابلية إعادة التدوير',
      allCategories: 'جميع الفئات',
      searchFixabilityPlaceholder: 'ابحث عن العلامات التجارية…',
      searchMaterialsPlaceholder: 'ابحث عن المواد…',
      noResults: 'لا يوجد ما يطابق هذا الفلتر.'
    },
    submit: {
      title: 'أرسل دليلاً',
      intro:
        'لا حاجة لحساب. يذهب هذا مباشرة إلى قائمة المراجعة لدينا — سيتحقق منه شخص ما، وإذا تمت الموافقة عليه يصبح صفحة دليل حقيقية. إذا لم يتم قبوله، سنخبرك بالسبب.',
      titleLabel: 'عنوان الدليل',
      titlePlaceholder: 'كيفية استبدال بطارية لابتوب',
      productLabel: 'المنتج / نوع المنتج',
      categoryLabel: 'الفئة',
      categoryPlaceholder: 'المنزل والكهرباء',
      difficultyLabel: 'مستوى الصعوبة',
      beginner: 'مبتدئ',
      intermediate: 'متوسط',
      advanced: 'متقدم',
      estimatedTimeLabel: 'الوقت المقدر',
      estimatedTimePlaceholder: '20 دقيقة',
      toolsLabel: 'الأدوات المطلوبة',
      toolsPlaceholder: 'واحد لكل سطر',
      coverPhotoLabel: 'صورة الغلاف',
      coverPhotoHelp: 'JPG أو PNG أو WebP أو GIF، حتى 5MB.',
      stepsLabel: 'الخطوات',
      addStep: '+ إضافة خطوة',
      stepPlaceholder: 'ماذا تفعل في هذه الخطوة؟',
      stepImageTitle: 'صورة لهذه الخطوة (اختياري، حتى 5MB)',
      stepPartPlaceholder: 'رابط قطعة: التسمية | الرابط (اختياري)',
      stepVideoPlaceholder: 'رابط فيديو: التسمية | الرابط (اختياري)',
      remove: 'إزالة',
      stepNumber: 'خطوة',
      partLinksLabel: 'روابط القطع',
      videoLinksLabel: 'روابط الفيديو',
      linksPlaceholder: 'واحد لكل سطر: التسمية | https://...',
      notesLabel: 'ملاحظات السلامة، ملاحظات التخلص، أي شيء آخر',
      authorLabel: 'اسمك (للنسب إليك)',
      submitButton: 'إرسال للمراجعة',
      githubPrompt: 'لديك حساب GitHub وتفضل استخدامه مباشرة؟',
      githubLink: 'افتح النموذج هناك بدلاً من ذلك',
      submitting: 'جارٍ الإرسال…',
      submitted: 'تم الإرسال! شكراً — يمكنك متابعة المراجعة هنا.',
      viewSubmission: 'عرض الطلب',
      genericError: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
      networkError: 'خطأ في الشبكة — يرجى المحاولة مرة أخرى.'
    }
  },
  es: {
    nav: { guides: 'Guías', data: 'Datos', submit: 'Enviar' },
    footer: { tagline: 'No obsolescencia — repáralo, no lo tires.' },
    home: {
      heroTitle: 'Repáralo. No lo tires.',
      heroSubtitle:
        'Guías de reparación y construcción gratuitas, creadas por la comunidad — además de datos sobre qué productos realmente vale la pena reparar, y qué materiales vale la pena usar para construir.',
      featuredGuides: 'Guías destacadas',
      noFeatured: 'Aún no hay guías destacadas.'
    },
    guides: {
      title: 'Todas las guías',
      empty: 'Todavía no hay guías en este idioma.',
      allCategories: 'Todas las categorías',
      searchPlaceholder: 'Buscar guías…'
    },
    guideDetail: { toolsNeeded: 'Herramientas necesarias', by: 'por', step: 'Paso' },
    linkList: { videos: 'Videos', parts: 'Dónde conseguir piezas' },
    draftBanner: {
      text: 'Esta página es un borrador traducido automáticamente y aún no ha sido revisado por una persona.',
      helpReview: 'Ayuda a revisar esta traducción'
    },
    data: {
      title: 'Datos de reparabilidad y materiales',
      subtitle:
        'Qué productos realmente vale la pena reparar, y qué materiales vale la pena usar para construir. Datos de ejemplo por ahora — todavía falta escribir la rúbrica de puntuación y la metodología de las fuentes.',
      fixabilityHeading: 'Reparabilidad por marca',
      materialsHeading: 'Referencia de materiales',
      durability: 'Durabilidad',
      recyclability: 'Reciclabilidad',
      allCategories: 'Todas las categorías',
      searchFixabilityPlaceholder: 'Buscar marcas…',
      searchMaterialsPlaceholder: 'Buscar materiales…',
      noResults: 'Nada coincide con ese filtro.'
    },
    submit: {
      title: 'Enviar una guía',
      intro:
        'No necesitas cuenta. Esto va directo a nuestra cola de revisión — alguien lo revisa, y si se aprueba se convierte en una página de guía real. Si no, te diremos por qué.',
      titleLabel: 'Título de la guía',
      titlePlaceholder: 'Cómo reemplazar la batería de un laptop',
      productLabel: 'Producto / tipo de producto',
      categoryLabel: 'Categoría',
      categoryPlaceholder: 'Hogar y electricidad',
      difficultyLabel: 'Dificultad',
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      estimatedTimeLabel: 'Tiempo estimado',
      estimatedTimePlaceholder: '20 minutos',
      toolsLabel: 'Herramientas necesarias',
      toolsPlaceholder: 'Una por línea',
      coverPhotoLabel: 'Foto de portada',
      coverPhotoHelp: 'JPG, PNG, WebP o GIF, hasta 5MB.',
      stepsLabel: 'Pasos',
      addStep: '+ Agregar paso',
      stepPlaceholder: '¿Qué se hace en este paso?',
      stepImageTitle: 'Foto de este paso (opcional, hasta 5MB)',
      stepPartPlaceholder: 'Enlace de pieza: Etiqueta | URL (opcional)',
      stepVideoPlaceholder: 'Enlace de video: Etiqueta | URL (opcional)',
      remove: 'Eliminar',
      stepNumber: 'Paso',
      partLinksLabel: 'Enlaces de piezas',
      videoLinksLabel: 'Enlaces de video',
      linksPlaceholder: 'Uno por línea: Etiqueta | https://...',
      notesLabel: 'Notas de seguridad, notas de desecho, cualquier otra cosa',
      authorLabel: 'Tu nombre (para el crédito)',
      submitButton: 'Enviar para revisión',
      githubPrompt: '¿Tienes una cuenta de GitHub y prefieres usarla directamente?',
      githubLink: 'Abrir el formulario allí en su lugar',
      submitting: 'Enviando…',
      submitted: '¡Enviado! Gracias — puedes seguir su revisión aquí.',
      viewSubmission: 'Ver envío',
      genericError: 'Algo salió mal. Por favor, inténtalo de nuevo.',
      networkError: 'Error de red — inténtalo de nuevo.'
    }
  },
  pt: {
    nav: { guides: 'Guias', data: 'Dados', submit: 'Enviar' },
    footer: { tagline: 'Não Obsolescência — conserte, não jogue fora.' },
    home: {
      heroTitle: 'Conserte. Não jogue fora.',
      heroSubtitle:
        'Guias de reparo e construção gratuitos, feitos pela comunidade — além de dados sobre quais produtos realmente valem a pena consertar, e quais materiais valem a pena usar para construir.',
      featuredGuides: 'Guias em destaque',
      noFeatured: 'Ainda não há guias em destaque.'
    },
    guides: {
      title: 'Todos os guias',
      empty: 'Ainda não há guias neste idioma.',
      allCategories: 'Todas as categorias',
      searchPlaceholder: 'Buscar guias…'
    },
    guideDetail: { toolsNeeded: 'Ferramentas necessárias', by: 'por', step: 'Passo' },
    linkList: { videos: 'Vídeos', parts: 'Onde conseguir peças' },
    draftBanner: {
      text: 'Esta página é um rascunho traduzido automaticamente e ainda não foi revisado por uma pessoa.',
      helpReview: 'Ajude a revisar esta tradução'
    },
    data: {
      title: 'Dados de reparabilidade e materiais',
      subtitle:
        'Quais produtos realmente valem a pena consertar, e quais materiais valem a pena usar para construir. Dados de exemplo por enquanto — a rubrica de pontuação e a metodologia de fontes ainda precisam ser escritas.',
      fixabilityHeading: 'Reparabilidade por marca',
      materialsHeading: 'Referência de materiais',
      durability: 'Durabilidade',
      recyclability: 'Reciclabilidade',
      allCategories: 'Todas as categorias',
      searchFixabilityPlaceholder: 'Buscar marcas…',
      searchMaterialsPlaceholder: 'Buscar materiais…',
      noResults: 'Nada corresponde a esse filtro.'
    },
    submit: {
      title: 'Enviar um guia',
      intro:
        'Não é necessária uma conta. Isso vai direto para nossa fila de revisão — alguém verifica, e se for aprovado vira uma página de guia de verdade. Se não for, explicamos o motivo.',
      titleLabel: 'Título do guia',
      titlePlaceholder: 'Como substituir a bateria de um laptop',
      productLabel: 'Produto / tipo de produto',
      categoryLabel: 'Categoria',
      categoryPlaceholder: 'Casa e elétrica',
      difficultyLabel: 'Dificuldade',
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
      estimatedTimeLabel: 'Tempo estimado',
      estimatedTimePlaceholder: '20 minutos',
      toolsLabel: 'Ferramentas necessárias',
      toolsPlaceholder: 'Um por linha',
      coverPhotoLabel: 'Foto de capa',
      coverPhotoHelp: 'JPG, PNG, WebP ou GIF, até 5MB.',
      stepsLabel: 'Passos',
      addStep: '+ Adicionar passo',
      stepPlaceholder: 'O que você faz nesta etapa?',
      stepImageTitle: 'Foto desta etapa (opcional, até 5MB)',
      stepPartPlaceholder: 'Link da peça: Rótulo | URL (opcional)',
      stepVideoPlaceholder: 'Link do vídeo: Rótulo | URL (opcional)',
      remove: 'Remover',
      stepNumber: 'Passo',
      partLinksLabel: 'Links de peças',
      videoLinksLabel: 'Links de vídeo',
      linksPlaceholder: 'Um por linha: Rótulo | https://...',
      notesLabel: 'Notas de segurança, notas de descarte, qualquer outra coisa',
      authorLabel: 'Seu nome (para crédito)',
      submitButton: 'Enviar para revisão',
      githubPrompt: 'Tem uma conta no GitHub e prefere usá-la diretamente?',
      githubLink: 'Abrir o formulário lá em vez disso',
      submitting: 'Enviando…',
      submitted: 'Enviado! Obrigado — você pode acompanhar a revisão aqui.',
      viewSubmission: 'Ver envio',
      genericError: 'Algo deu errado. Tente novamente.',
      networkError: 'Erro de rede — tente novamente.'
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
