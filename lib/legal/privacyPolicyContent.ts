import {
  COMPANY_BRAND,
  COMPANY_LEGAL_NAME,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  PRIVACY_POLICY_LAST_UPDATED,
  WEBSITE,
} from './constants';

export type PrivacySection = {
  title: string;
  paragraphs: string[];
};

export type PrivacyPolicyContent = {
  pageTitle: string;
  lastUpdatedLabel: string;
  intro: string;
  sections: PrivacySection[];
};

export const privacyPolicyBg: PrivacyPolicyContent = {
  pageTitle: 'Политика за поверителност',
  lastUpdatedLabel: `Последна актуализация: ${PRIVACY_POLICY_LAST_UPDATED}`,
  intro: `${COMPANY_LEGAL_NAME} („ние“, „администратор“) обработва лични данни при онлайн резервации за ${COMPANY_BRAND} чрез сайта ${WEBSITE}. Настоящата политика описва какви данни събираме, защо ги използваме и какви са вашите права съгласно Регламент (ЕС) 2016/679 (GDPR) и българското законодателство.`,
  sections: [
    {
      title: '1. Администратор на лични данни',
      paragraphs: [
        `${COMPANY_LEGAL_NAME}`,
        `Търговска марка / салон: ${COMPANY_BRAND}`,
        `Телефон: ${CONTACT_PHONE}`,
        `Имейл: ${CONTACT_EMAIL}`,
      ],
    },
    {
      title: '2. Какви данни събираме',
      paragraphs: [
        'При онлайн резервация: име, телефонен номер, имейл адрес, избрани услуги, дата и час на часа, избран фризьор (ако е посочен), както и бележки, ако сте ги въвели.',
        'Технически данни: езикови настройки (запазени локално в браузъра), сесийни бисквитки, необходими за работа на сайта и вход в служебни панели (за персонал).',
        'Не събираме умишлено чувствителни категории лични данни (напр. здравни данни) чрез формата за резервация.',
      ],
    },
    {
      title: '3. Цели и правно основание',
      paragraphs: [
        'Резервация и изпълнение на услугата — обработка на заявката, потвърждение по имейл, организация на графика в салона (правно основание: изпълнение на договор / преддоговорни стъпки по ваше искане).',
        'Връзка с вас при промяна или отмяна на час — телефон или имейл (правно основание: изпълнение на договор / легитимен интерес).',
        'Счетоводство и законови задължения, когато се прилагат (правно основание: законово задължение).',
        'Не използваме данните ви за директен маркетинг без отделно съгласие.',
      ],
    },
    {
      title: '4. Получатели и обработващи',
      paragraphs: [
        'Данните се съхраняват в защитена база данни (Supabase — хостинг в ЕС/подходящи региони според доставчика).',
        'Имейл за потвърждение се изпраща чрез Resend от адрес на домейна на салона.',
        'Сайтът се хоства при доставчик на уеб услуги (напр. Vercel).',
        'Достъп имат оторизиран персонал на салона (собственик, фризьори) само в рамките на необходимото за работа.',
        'Не продаваме личните ви данни на трети страни.',
      ],
    },
    {
      title: '5. Срок на съхранение',
      paragraphs: [
        'Данни за резервации се пазят толкова дълго, колкото е нужно за изпълнение на услугата, счетоводство и защита при евентуални спорове — обикновено до 3 години след датата на часа, освен ако законът не изисква по-дълъг срок.',
        'Можете да поискате изтриване по-рано, ако няма законово задължение да ги запазим.',
      ],
    },
    {
      title: '6. Вашите права',
      paragraphs: [
        'Имате право на: достъп, корекция, изтриване („право да бъдете забравени“), ограничаване на обработката, преносимост (когато е приложимо), възражение срещу обработка на основание легитимен интерес, както и оттегляне на съгласие (ако обработката е на такова основание).',
        `За упражняване на правата: ${CONTACT_EMAIL} или ${CONTACT_PHONE}.`,
        'Имате право на жалба до Комисията за защита на личните данни (КЗЛД) — www.cpdp.bg.',
      ],
    },
    {
      title: '7. Сигурност',
      paragraphs: [
        'Прилагаме подходящи технически и организационни мерки (криптирана връзка HTTPS, ограничен достъп, пароли за служебни акаунти), за да защитим данните от неоторизиран достъп, загуба или злоупотреба.',
      ],
    },
    {
      title: '8. Бисквитки',
      paragraphs: [
        'Използваме необходими бисквитки за сесия и език. Не използваме рекламни или аналитични бисквитки на трети страни, освен ако по-късно не бъде добавено и не бъдете уведомени.',
      ],
    },
    {
      title: '9. Промени',
      paragraphs: [
        'Можем да актуализираме тази политика. Новата версия ще бъде публикувана на тази страница с нова дата на актуализация.',
      ],
    },
  ],
};

export const privacyPolicyEn: PrivacyPolicyContent = {
  pageTitle: 'Privacy Policy',
  lastUpdatedLabel: `Last updated: ${PRIVACY_POLICY_LAST_UPDATED}`,
  intro: `${COMPANY_LEGAL_NAME} (“we”, “controller”) processes personal data when you book appointments for ${COMPANY_BRAND} via ${WEBSITE}. This policy explains what we collect, why we use it, and your rights under the EU GDPR and applicable Bulgarian law.`,
  sections: [
    {
      title: '1. Data controller',
      paragraphs: [
        `${COMPANY_LEGAL_NAME}`,
        `Trading as: ${COMPANY_BRAND}`,
        `Phone: ${CONTACT_PHONE}`,
        `Email: ${CONTACT_EMAIL}`,
      ],
    },
    {
      title: '2. Data we collect',
      paragraphs: [
        'When booking online: name, phone number, email, selected services, appointment date and time, chosen stylist (if any), and notes you provide.',
        'Technical data: language preference (stored locally in your browser), session cookies required for the site and staff login areas.',
        'We do not intentionally collect special categories of personal data (e.g. health data) through the booking form.',
      ],
    },
    {
      title: '3. Purposes and legal basis',
      paragraphs: [
        'Booking and service delivery — processing your request, email confirmation, salon schedule management (legal basis: contract / pre-contract steps at your request).',
        'Contact regarding changes or cancellation (legal basis: contract / legitimate interest).',
        'Accounting and legal obligations where applicable (legal basis: legal obligation).',
        'We do not use your data for direct marketing without separate consent.',
      ],
    },
    {
      title: '4. Recipients and processors',
      paragraphs: [
        'Data is stored in a secured database (Supabase).',
        'Confirmation emails are sent via Resend from the salon domain.',
        'The website is hosted with a cloud hosting provider (e.g. Vercel).',
        'Authorized salon staff (owner, stylists) may access data only as needed for operations.',
        'We do not sell your personal data.',
      ],
    },
    {
      title: '5. Retention',
      paragraphs: [
        'Booking data is kept as long as needed for the service, accounting, and dispute protection — typically up to 3 years after the appointment date, unless law requires longer retention.',
        'You may request earlier deletion where we have no legal duty to retain the data.',
      ],
    },
    {
      title: '6. Your rights',
      paragraphs: [
        'You have the right to access, rectify, erase, restrict processing, data portability (where applicable), object to processing based on legitimate interest, and withdraw consent where processing is consent-based.',
        `To exercise your rights: ${CONTACT_EMAIL} or ${CONTACT_PHONE}.`,
        'You may lodge a complaint with the Bulgarian Commission for Personal Data Protection (CPDP) — www.cpdp.bg.',
      ],
    },
    {
      title: '7. Security',
      paragraphs: [
        'We apply appropriate technical and organizational measures (HTTPS, access controls, staff authentication) to protect data against unauthorized access, loss, or misuse.',
      ],
    },
    {
      title: '8. Cookies',
      paragraphs: [
        'We use essential cookies for session and language. We do not use third-party advertising or analytics cookies unless added later with notice.',
      ],
    },
    {
      title: '9. Changes',
      paragraphs: [
        'We may update this policy. The new version will be published on this page with an updated date.',
      ],
    },
  ],
};
