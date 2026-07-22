# SHYIRA Sweet — إعداد لوحة التحكم الحقيقية

هذه النسخة لا تحتوي على نظام طلبات. الموقع يقوم بشيئين فقط:

1. عرض الأعمال والصور (Portfolio / Work Gallery).
2. استقبال بيانات واستفسارات الزوار (Inquiries).

لوحة التحكم الجديدة تحتوي على:
- تسجيل دخول Email + Password.
- مشاهدة الاستفسارات.
- تغيير حالة الاستفسار: New / Contacted / Completed.
- إضافة وتعديل وحذف وإخفاء صور الأعمال.
- تعديل رقم الهاتف وواتساب وإنستغرام وفيسبوك والمدينة.
- تعديل نص الفوتر وحقوق النشر من لوحة التحكم.
- إرسال إشعار اختياري إلى Discord عند وصول استفسار جديد.

---

## 1) إنشاء مشروع Supabase

ادخل إلى Supabase وأنشئ مشروعًا جديدًا.

بعد فتح المشروع، افتح SQL Editor ثم انسخ محتوى الملف:

`supabase/setup.sql`

وشغّله بالكامل مرة واحدة.

هذا ينشئ الجداول والحماية وقاعدة بيانات الاستفسارات ومعرض الأعمال.

---

## 2) إنشاء حساب المالك Email + Password

في Supabase افتح:

Authentication > Users

أنشئ مستخدمًا جديدًا بإيميلك وكلمة مرور قوية.

بعد إنشاء المستخدم، انسخ UUID الخاص به.

ارجع إلى SQL Editor وشغّل هذا السطر بعد استبدال YOUR-USER-UUID:

```sql
insert into public.admin_users (user_id)
values ('YOUR-USER-UUID');
```

هذا هو الحساب الوحيد الذي سيُسمح له بالدخول إلى لوحة التحكم، إلا إذا أضفت مستخدمين آخرين بنفس الطريقة.

---

## 3) إضافة مفاتيح Supabase إلى Netlify

من Supabase احصل على:

- Project URL
- Publishable key
- Secret key

ثم افتح Netlify للموقع `shyia.netlify.app` واذهب إلى:

Project configuration > Environment variables

أضف القيم التالية:

```text
VITE_SUPABASE_URL = رابط مشروع Supabase
VITE_SUPABASE_PUBLISHABLE_KEY = Publishable key
SUPABASE_URL = رابط مشروع Supabase
SUPABASE_SECRET_KEY = Secret key
```

مهم جدًا:
- `VITE_SUPABASE_PUBLISHABLE_KEY` يمكن استخدامه في المتصفح مع RLS.
- `SUPABASE_SECRET_KEY` سرّي جدًا ولا يوضع داخل GitHub أو أي ملف في المشروع.
- إذا كان حساب Supabase القديم يعرض `service_role` بدل Secret key، يمكنك في Netlify استخدام اسم `SUPABASE_SERVICE_ROLE_KEY` بدل `SUPABASE_SECRET_KEY`؛ الكود يدعم الاثنين.

---

## 4) ربط Discord — اختياري

في Discord:

Server Settings > Integrations > Webhooks > New Webhook

اختر القناة التي تريد استقبال الاستفسارات فيها، ثم انسخ Webhook URL.

في Netlify > Environment variables أضف:

```text
DISCORD_WEBHOOK_URL = رابط Discord Webhook
```

لا تضع رابط Discord Webhook داخل GitHub لأنه يعتبر سرًا.

بعدها كل استفسار جديد:
- يُحفظ في لوحة التحكم.
- ويصل إشعار إلى Discord إذا أضفت المتغير.

---

## 5) رفع ملفات النسخة الجديدة إلى GitHub

استبدل ملفات المشروع القديمة بملفات هذه النسخة.

أهم الملفات الجديدة أو المعدلة:

```text
src/components/AdminDashboard.tsx
src/components/Contact.tsx
src/components/Footer.tsx
src/components/Gallery.tsx
src/lib/supabase.ts
src/lib/siteSettings.ts
src/vite-env.d.ts
netlify/functions/submit-inquiry.mts
supabase/setup.sql
netlify.toml
package.json
.env.example
```

بعد Commit changes سيبدأ Netlify Deploy تلقائيًا.

إذا ظهر خطأ متعلقًا بـ package-lock.json بعد إضافة Supabase، احذف `package-lock.json` من GitHub مرة واحدة ثم اعمل Deploy جديد. Netlify سيقوم بتثبيت الحزم الموجودة في package.json.

---

## 6) الدخول إلى لوحة التحكم

بعد نجاح Deploy افتح:

```text
https://shyia.netlify.app/?admin
```

ستظهر شاشة تسجيل الدخول.

استخدم Email + Password للحساب الذي أنشأته في Supabase وأضفت UUID الخاص به إلى جدول `admin_users`.

---

## 7) أين تصل بيانات الفورم؟

الفورم الجديد لا يستخدم Formspree.

عندما يرسل الزائر بياناته:

Website Contact Form
→ Netlify Function
→ Supabase `inquiries`
→ Admin Dashboard
→ Discord (اختياري)

داخل لوحة التحكم افتح تبويب:

`Inquiries`

ثم تستطيع تغيير الحالة إلى:

- New
- Contacted
- Completed

---

## 8) تعديل معرض الأعمال

من لوحة التحكم:

`Portfolio`

يمكنك:
- Add Work
- رفع صورة من جهازك.
- كتابة العنوان والتصنيف والوصف.
- إخفاء الصورة من الموقع بدون حذفها.
- تعديل الصورة أو حذفها.

الصور المرفوعة تُحفظ في Supabase Storage وتظهر في Gallery على الموقع العام.

---

## 9) تغيير © 2026 SHYIRA Sweet. All rights reserved.

في النسخة الجديدة ادخل:

`?admin` > Settings

وابحث عن:

`Copyright / rights text`

القيمة الافتراضية:

```text
SHYIRA Sweet. All rights reserved.
```

يمكنك تغييرها إلى أي نص، مثل:

```text
SHYIRA Sweet. Handmade in Michigan.
```

السنة لا تحتاج إلى تعديل يدويًا؛ الموقع يستخدم السنة الحالية تلقائيًا:

```text
© 2026 SHYIRA Sweet. All rights reserved.
```

وفي 2027 ستصبح تلقائيًا:

```text
© 2027 SHYIRA Sweet. All rights reserved.
```

---

## 10) تعديل معلومات التواصل مستقبلًا

من:

`?admin` > Settings

تستطيع تغيير:
- Phone
- WhatsApp
- Instagram
- Facebook
- City
- Footer tagline
- Copyright text

ولا تحتاج إلى تعديل GitHub لهذه المعلومات بعد الآن.
