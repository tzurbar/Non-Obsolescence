import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    dir: 'ltr',
    hero: {
      title: "Fix It. Build It. Keep It.",
      subtitle: "Join the community fighting planned obsolescence",
      searchPlaceholder: "What do you want to fix or build?",
      search: "Search"
    },
    nav: {
      home: "Home",
      guides: "Guides",
      submit: "Submit Guide",
      profile: "Profile",
      admin: "Admin",
      login: "Sign In",
      logout: "Logout"
    },
    home: {
      featured: "Featured Guides",
      popular: "Popular Categories",
      cta: "Share Your Knowledge",
      ctaText: "Help others repair and build. Submit your own guide today.",
      ctaButton: "Submit a Guide"
    },
    guide: {
      difficulty: "Difficulty",
      tools: "Tools Required",
      time: "Estimated Time",
      steps: "Steps",
      by: "By",
      save: "Save",
      saved: "Saved",
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced"
    },
    submit: {
      title: "Submit a Guide",
      guideTitle: "Guide Title",
      category: "Category",
      product: "Product Name",
      difficulty: "Difficulty",
      tools: "Tools (comma separated)",
      time: "Estimated Time",
      coverImage: "Cover Image",
      steps: "Steps",
      addStep: "Add Step",
      stepTitle: "Step Title",
      stepDescription: "Step Description",
      stepImage: "Step Image",
      submit: "Submit for Review",
      success: "Guide submitted successfully! It will be reviewed soon."
    },
    profile: {
      saved: "Saved Guides",
      submitted: "My Submissions",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      noSaved: "No saved guides yet",
      noSubmitted: "No submitted guides yet"
    },
    admin: {
      title: "Admin Dashboard",
      pending: "Pending Reviews",
      categories: "Manage Categories",
      approve: "Approve",
      reject: "Reject",
      addCategory: "Add Category",
      noPending: "No pending guides"
    },
    filters: {
      all: "All",
      category: "Category",
      difficulty: "Difficulty",
      search: "Search guides..."
    },
    footer: {
      mission: "Fighting planned obsolescence, one repair at a time.",
      rights: "All rights reserved."
    }
  },
  he: {
    dir: 'rtl',
    hero: {
      title: "תקן. בנה. שמור.",
      subtitle: "הצטרפו לקהילה שנלחמת בהתיישנות מתוכננת",
      searchPlaceholder: "מה אתה רוצה לתקן או לבנות?",
      search: "חפש"
    },
    nav: {
      home: "בית",
      guides: "מדריכים",
      submit: "שלח מדריך",
      profile: "פרופיל",
      admin: "ניהול",
      login: "התחבר",
      logout: "התנתק"
    },
    home: {
      featured: "מדריכים מומלצים",
      popular: "קטגוריות פופולריות",
      cta: "שתפו את הידע שלכם",
      ctaText: "עזרו לאחרים לתקן ולבנות. שלחו מדריך משלכם היום.",
      ctaButton: "שלח מדריך"
    },
    guide: {
      difficulty: "רמת קושי",
      tools: "כלים נדרשים",
      time: "זמן משוער",
      steps: "שלבים",
      by: "מאת",
      save: "שמור",
      saved: "נשמר",
      beginner: "מתחיל",
      intermediate: "בינוני",
      advanced: "מתקדם"
    },
    submit: {
      title: "שלח מדריך",
      guideTitle: "כותרת המדריך",
      category: "קטגוריה",
      product: "שם המוצר",
      difficulty: "רמת קושי",
      tools: "כלים (מופרדים בפסיק)",
      time: "זמן משוער",
      coverImage: "תמונת כיסוי",
      steps: "שלבים",
      addStep: "הוסף שלב",
      stepTitle: "כותרת השלב",
      stepDescription: "תיאור השלב",
      stepImage: "תמונת השלב",
      submit: "שלח לבדיקה",
      success: "המדריך נשלח בהצלחה! הוא ייבדק בקרוב."
    },
    profile: {
      saved: "מדריכים שמורים",
      submitted: "ההגשות שלי",
      pending: "ממתין",
      approved: "אושר",
      rejected: "נדחה",
      noSaved: "אין מדריכים שמורים",
      noSubmitted: "אין מדריכים שהוגשו"
    },
    admin: {
      title: "לוח בקרה",
      pending: "ממתינים לאישור",
      categories: "ניהול קטגוריות",
      approve: "אשר",
      reject: "דחה",
      addCategory: "הוסף קטגוריה",
      noPending: "אין מדריכים ממתינים"
    },
    filters: {
      all: "הכל",
      category: "קטגוריה",
      difficulty: "רמת קושי",
      search: "חפש מדריכים..."
    },
    footer: {
      mission: "נלחמים בהתיישנות מתוכננת, תיקון אחד בכל פעם.",
      rights: "כל הזכויות שמורות."
    }
  },
  ar: {
    dir: 'rtl',
    hero: {
      title: "أصلح. ابنِ. احتفظ.",
      subtitle: "انضم إلى المجتمع الذي يحارب التقادم المخطط",
      searchPlaceholder: "ماذا تريد أن تصلح أو تبني؟",
      search: "بحث"
    },
    nav: {
      home: "الرئيسية",
      guides: "الأدلة",
      submit: "أرسل دليل",
      profile: "الملف الشخصي",
      admin: "الإدارة",
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج"
    },
    home: {
      featured: "أدلة مميزة",
      popular: "الفئات الشائعة",
      cta: "شارك معرفتك",
      ctaText: "ساعد الآخرين في الإصلاح والبناء. أرسل دليلك اليوم.",
      ctaButton: "أرسل دليل"
    },
    guide: {
      difficulty: "الصعوبة",
      tools: "الأدوات المطلوبة",
      time: "الوقت المقدر",
      steps: "الخطوات",
      by: "بواسطة",
      save: "حفظ",
      saved: "محفوظ",
      beginner: "مبتدئ",
      intermediate: "متوسط",
      advanced: "متقدم"
    },
    submit: {
      title: "أرسل دليل",
      guideTitle: "عنوان الدليل",
      category: "الفئة",
      product: "اسم المنتج",
      difficulty: "الصعوبة",
      tools: "الأدوات (مفصولة بفاصلة)",
      time: "الوقت المقدر",
      coverImage: "صورة الغلاف",
      steps: "الخطوات",
      addStep: "أضف خطوة",
      stepTitle: "عنوان الخطوة",
      stepDescription: "وصف الخطوة",
      stepImage: "صورة الخطوة",
      submit: "إرسال للمراجعة",
      success: "تم إرسال الدليل بنجاح! سيتم مراجعته قريباً."
    },
    profile: {
      saved: "الأدلة المحفوظة",
      submitted: "طلباتي",
      pending: "قيد الانتظار",
      approved: "موافق عليه",
      rejected: "مرفوض",
      noSaved: "لا توجد أدلة محفوظة",
      noSubmitted: "لا توجد أدلة مرسلة"
    },
    admin: {
      title: "لوحة الإدارة",
      pending: "في انتظار المراجعة",
      categories: "إدارة الفئات",
      approve: "موافقة",
      reject: "رفض",
      addCategory: "إضافة فئة",
      noPending: "لا توجد أدلة في الانتظار"
    },
    filters: {
      all: "الكل",
      category: "الفئة",
      difficulty: "الصعوبة",
      search: "البحث في الأدلة..."
    },
    footer: {
      mission: "نحارب التقادم المخطط، إصلاح واحد في كل مرة.",
      rights: "جميع الحقوق محفوظة."
    }
  },
  es: {
    dir: 'ltr',
    hero: {
      title: "Repara. Construye. Conserva.",
      subtitle: "Únete a la comunidad que lucha contra la obsolescencia programada",
      searchPlaceholder: "¿Qué quieres reparar o construir?",
      search: "Buscar"
    },
    nav: {
      home: "Inicio",
      guides: "Guías",
      submit: "Enviar Guía",
      profile: "Perfil",
      admin: "Admin",
      login: "Iniciar Sesión",
      logout: "Cerrar Sesión"
    },
    home: {
      featured: "Guías Destacadas",
      popular: "Categorías Populares",
      cta: "Comparte tu Conocimiento",
      ctaText: "Ayuda a otros a reparar y construir. Envía tu guía hoy.",
      ctaButton: "Enviar una Guía"
    },
    guide: {
      difficulty: "Dificultad",
      tools: "Herramientas",
      time: "Tiempo Estimado",
      steps: "Pasos",
      by: "Por",
      save: "Guardar",
      saved: "Guardado",
      beginner: "Principiante",
      intermediate: "Intermedio",
      advanced: "Avanzado"
    },
    submit: {
      title: "Enviar una Guía",
      guideTitle: "Título de la Guía",
      category: "Categoría",
      product: "Nombre del Producto",
      difficulty: "Dificultad",
      tools: "Herramientas (separadas por coma)",
      time: "Tiempo Estimado",
      coverImage: "Imagen de Portada",
      steps: "Pasos",
      addStep: "Agregar Paso",
      stepTitle: "Título del Paso",
      stepDescription: "Descripción del Paso",
      stepImage: "Imagen del Paso",
      submit: "Enviar para Revisión",
      success: "¡Guía enviada! Será revisada pronto."
    },
    profile: {
      saved: "Guías Guardadas",
      submitted: "Mis Envíos",
      pending: "Pendiente",
      approved: "Aprobado",
      rejected: "Rechazado",
      noSaved: "No hay guías guardadas",
      noSubmitted: "No hay guías enviadas"
    },
    admin: {
      title: "Panel de Admin",
      pending: "Pendientes de Revisión",
      categories: "Gestionar Categorías",
      approve: "Aprobar",
      reject: "Rechazar",
      addCategory: "Agregar Categoría",
      noPending: "No hay guías pendientes"
    },
    filters: {
      all: "Todos",
      category: "Categoría",
      difficulty: "Dificultad",
      search: "Buscar guías..."
    },
    footer: {
      mission: "Luchando contra la obsolescencia, una reparación a la vez.",
      rights: "Todos los derechos reservados."
    }
  },
  pt: {
    dir: 'ltr',
    hero: {
      title: "Conserte. Construa. Mantenha.",
      subtitle: "Junte-se à comunidade contra a obsolescência programada",
      searchPlaceholder: "O que você quer consertar ou construir?",
      search: "Buscar"
    },
    nav: {
      home: "Início",
      guides: "Guias",
      submit: "Enviar Guia",
      profile: "Perfil",
      admin: "Admin",
      login: "Entrar",
      logout: "Sair"
    },
    home: {
      featured: "Guias em Destaque",
      popular: "Categorias Populares",
      cta: "Compartilhe seu Conhecimento",
      ctaText: "Ajude outros a consertar e construir. Envie seu guia hoje.",
      ctaButton: "Enviar um Guia"
    },
    guide: {
      difficulty: "Dificuldade",
      tools: "Ferramentas",
      time: "Tempo Estimado",
      steps: "Passos",
      by: "Por",
      save: "Salvar",
      saved: "Salvo",
      beginner: "Iniciante",
      intermediate: "Intermediário",
      advanced: "Avançado"
    },
    submit: {
      title: "Enviar um Guia",
      guideTitle: "Título do Guia",
      category: "Categoria",
      product: "Nome do Produto",
      difficulty: "Dificuldade",
      tools: "Ferramentas (separadas por vírgula)",
      time: "Tempo Estimado",
      coverImage: "Imagem de Capa",
      steps: "Passos",
      addStep: "Adicionar Passo",
      stepTitle: "Título do Passo",
      stepDescription: "Descrição do Passo",
      stepImage: "Imagem do Passo",
      submit: "Enviar para Revisão",
      success: "Guia enviado! Será revisado em breve."
    },
    profile: {
      saved: "Guias Salvos",
      submitted: "Meus Envios",
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado",
      noSaved: "Nenhum guia salvo",
      noSubmitted: "Nenhum guia enviado"
    },
    admin: {
      title: "Painel Admin",
      pending: "Pendentes de Revisão",
      categories: "Gerenciar Categorias",
      approve: "Aprovar",
      reject: "Rejeitar",
      addCategory: "Adicionar Categoria",
      noPending: "Nenhum guia pendente"
    },
    filters: {
      all: "Todos",
      category: "Categoria",
      difficulty: "Dificuldade",
      search: "Buscar guias..."
    },
    footer: {
      mission: "Lutando contra obsolescência, um reparo de cada vez.",
      rights: "Todos os direitos reservados."
    }
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('language') || 'en';
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = translations[language]?.dir || 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return { language: 'en', setLanguage: () => {}, t: translations.en, translations };
  }
  return context;
}