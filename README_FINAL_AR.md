# SHYIRA Sweet — النسخة النهائية المدمجة

هذه النسخة تجمع كل ما تحتاجه في لوحة الإدارة:

- تسجيل دخول آمن Email + Password عبر Supabase Auth
- Inquiries: عرض رسائل العملاء وتغيير الحالة New / Contacted / Completed
- Products: إضافة / تعديل / حذف / إخفاء المنتجات + رفع صورة المنتج
- Gallery / Work: إضافة / تعديل / حذف / إخفاء صور الأعمال + رفع الصور
- Settings: تعديل الهاتف وواتساب وإنستغرام وفيسبوك والمدينة ونص الفوتر وحقوق النشر
- قائمة المنتجات في الموقع العام تقرأ مباشرة من Supabase
- معرض الصور في الموقع العام يقرأ مباشرة من Supabase
- نموذج التواصل يحفظ الاستفسارات في Supabase، مع fallback مباشر إذا تعطلت Netlify Function
- Discord اختياري لاحقًا عبر DISCORD_WEBHOOK_URL

## 1) Supabase

افتح SQL Editor وشغّل الملف:

`supabase/setup.sql`

هذا الملف مصمم لترقية الجداول القديمة أيضًا، ويصلح تعارض حالة الاستفسارات القديمة بين New و new.

بعدها تأكد أن حسابك موجود في Authentication > Users، ثم أضف UUID الخاص بك:

```sql
insert into public.admin_users (user_id, display_name)
values ('YOUR-USER-UUID', 'Owner')
on conflict (user_id) do nothing;
```

للتحقق:

```sql
select au.user_id, au.display_name, u.email
from public.admin_users au
join auth.users u on u.id = au.user_id;
```

## 2) Netlify Environment Variables

يجب أن تكون موجودة:

- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_URL
- SUPABASE_SECRET_KEY

Discord لاحقًا فقط:

- DISCORD_WEBHOOK_URL

## 3) GitHub

ارفع محتويات هذا المجلد إلى جذر repository `shyira-sweet` واستبدل الملفات القديمة.

مهم: يجب أن تصل الملفات إلى المسارات التالية مباشرة:

- src/components/AdminDashboard.tsx
- src/components/Menu.tsx
- src/components/Gallery.tsx
- src/components/Contact.tsx
- netlify/functions/submit-inquiry.mts
- supabase/setup.sql
- package.json
- netlify.toml

لا ترفع المجلد الأب كطبقة إضافية.

## 4) Netlify

بعد Commit جديد، انتظر Deploy حتى يصبح Published.

لوحة الإدارة:

`https://shyia.netlify.app/?admin`

## 5) اختبار

1. افتح ?admin وسجل الدخول.
2. تأكد من وجود tabs: Inquiries / Products / Gallery / Work / Settings.
3. أضف Product تجريبي بصورة ثم تأكد أنه ظهر في الموقع العام.
4. أضف Gallery image وتأكد أنها ظهرت في Gallery.
5. أرسل Inquiry تجريبي من الموقع وتأكد أنه ظهر في Inquiries.
6. جرّب تغيير الحالة إلى Contacted ثم Completed.
7. جرّب تعديل Copyright من Settings.

