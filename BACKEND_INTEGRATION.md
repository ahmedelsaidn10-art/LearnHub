# LearnHub — دليل ربط الفرونت إند بالباك إند

الدليل ده بيوضح عناوين الـAPI، الطلبات والردود، تسجيل الدخول بالكوكيز، تأكيد البريد، الكورسات، «كورساتي»، المفضلة، والتقسيم إلى صفحات.

## 1. عنوان السيرفر والتشغيل المحلي

شغّل الباك إند، وبعد ظهور عنوان التشغيل استخدم:

```text
http://127.0.0.1:5000
```

كل المسارات في بقية الملف تضاف إلى العنوان ده. مثال:

```text
GET http://127.0.0.1:5000/api/courses?page=1
```

لو الفرونت شغال بـVite على`http://localhost:5173` أو`http://127.0.0.1:5173` فالعناوين دي مسموح لها تعمل طلبات للباك إند. استخدم نفس اسم المضيف في كل طلبات Postman؛ ما تخلطش بين`localhost` و`127.0.0.1` لأن الكوكيز مرتبطة بالمضيف.

مسار فحص تشغيل السيرفر:

```text
GET /api/health
```

الرد:

```json
{"status":"ok"}
```

## 2. الشكل العام للردود

معظم ردود الـAPI بتيجي بالشكل ده:

```json
{
  "success": true,
  "message": "Courses loaded.",
  "data": {}
}
```

في الخطأ المتوقع، بيكون`success` يساوي`false` و`data` تساوي`null`:

```json
{
  "success": false,
  "message": "Course was not found.",
  "data": null
}
```

ملاحظة: أخطاء التوكن والـCSRF بتحصل قبل وصول الطلب للـController، وممكن ترجع بصيغة Flask-JWT-Extended مثل`{"msg":"Missing CSRF token"}` بدل الغلاف المعتاد.

## 3. تسجيل الدخول والكوكيز وCSRF

الـJWT بيتخزن في كوكي HttpOnly؛ الفرونت ما بيقرأش التوكن ولا يخزنه في`localStorage`. في طلبات المتصفح استخدم`credentials: "include"` مع`fetch`، أو`withCredentials: true` مع Axios.

لأن المصادقة بالكوكيز، الطلبات التي تغيّر البيانات تحتاج CSRF:

- Postman يحفظ كوكيز الدخول تلقائيًا إذا استخدمت نفس المضيف.
- كوكي`csrf_access_token` تحتوي قيمة CSRF.
- ابعت قيمتها في Header اسمه`X-CSRF-TOKEN`.
- طلبات`POST` و`PUT` و`PATCH` و`DELETE` المحمية بالتوكن تحتاج الهيدر ده.
- الفرونت يرسل الكوكيز، ويقرأ قيمة`csrf_access_token` ويرسلها تلقائيًا في`X-CSRF-TOKEN` مع الطلبات التي تغيّر البيانات.
- في التطوير المحلي، Vite يعمل Proxy لمسارات`/api` و`/uploads` إلى Flask؛ استخدم أصل الفرونت نفسه حتى تعمل كوكيز الجلسة وCSRF.

لإضافة الهيدر تلقائيًا لطلبات Postman، ضع السكريبت ده في **Collection → Scripts → Pre-request**:

```javascript
const csrfToken = pm.cookies.get("csrf_access_token");

if (csrfToken) {
  pm.request.headers.upsert({
    key: "X-CSRF-TOKEN",
    value: csrfToken
  });
}
```

خلي`JWT_COOKIE_SECURE=false` للتطوير على HTTP المحلي. في الإنتاج لازم HTTPS و`JWT_COOKIE_SECURE=true`، وتُضبط إعدادات CORS والكوكيز على عنوان الموقع الفعلي.

## 4. المصادقة والحساب

### إنشاء حساب

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Test Student",
  "email": "student@example.com",
  "password": "StrongPass123"
}
```

الاسم مطلوب وبحد أقصى 120 حرفًا. كلمة المرور من 8 إلى 128 حرفًا. الحساب الجديد يبدأ بدور`student` وبريد غير مؤكد، ويبعت النظام OTP على البريد.

النجاح:`201 Created`. مثال:

```json
{
  "success": true,
  "message": "Your account was created. Check your email for the verification code.",
  "data": null
}
```

### تأكيد البريد بالـOTP

```http
POST /api/auth/verify-email
Content-Type: application/json
```

```json
{
  "email": "student@example.com",
  "code": "123456"
}
```

أرسل رمز OTP كنص من 6 أرقام. بعد نجاح التأكيد يقدر المستخدم يعمل Login.

### إعادة إرسال رمز التأكيد

```http
POST /api/auth/resend-verification
Content-Type: application/json
```

```json
{
  "email": "student@example.com"
}
```

البريد المؤكد يرجع رسالة إنه مؤكد بالفعل. للحساب غير المؤكد، يستبدل النظام الرمز القديم ويرسل رمزًا جديدًا صالحًا لمدة محددة.

### تسجيل الدخول

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "student@example.com",
  "password": "StrongPass123"
}
```

لازم البريد يكون مؤكدًا. النجاح يرجع بيانات المستخدم ويضبط كوكيز الدخول وCSRF:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": 7,
      "name": "Test Student",
      "email": "student@example.com",
      "role": "student"
    }
  }
}
```

مدة صلاحية access token الافتراضية 30 دقيقة.`rememberMe` ليس مدعومًا حاليًا من الباك إند.

### المستخدم الحالي

```http
GET /api/auth/me
```

يرجع بيانات المستخدم لو فيه كوكي دخول صالحة. لو الزائر مش عامل Login، يرجع`success: true` و`data: null`، عشان الصفحات العامة تفضل متاحة.

### تسجيل الخروج

```http
POST /api/auth/logout
```

المسار يمسح كوكيز الدخول حتى لو التوكن منتهي أو غير موجود؛ لا يحتاج JWT صالح.

## 5. الكتالوج وتفاصيل الكورس

### عرض الكتالوج مع Pagination

```http
GET /api/courses?page=1
```

عام ومتاح بدون تسجيل دخول. كل صفحة فيها 6 كورسات، والترتيب حسب`published` ثم رقم الكورس. مثال شكل الرد:

```json
{
  "success": true,
  "message": "Courses loaded.",
  "data": {
    "items": [
      {
        "id": 2,
        "title": "Full-Stack Web Development Bootcamp 2026",
        "favoriteCount": 1842
      }
    ],
    "pagination": {
      "page": 1,
      "perPage": 6,
      "totalItems": 8,
      "totalPages": 2,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

غيّر`page` إلى 2 لطلب الصفحة التالية. حجم الصفحة ثابت، لا ترسل`per_page`. لازم رقم الصفحة يكون عددًا صحيحًا موجبًا. الصفحة الفاضية ترجع`items: []`. لو مفيش نتائج،`totalPages` تساوي 0.

### تفاصيل كورس

```http
GET /api/courses/2
```

التفاصيل عامة. لو أُرسل توكن اختياري صالح، يظهر هل المستخدم مسجل في الكورس وحالة تقدمه. داخل`details.curriculum` ترجع الأقسام، والدروس معها`id` و`title` و`completed`؛ تكون`completed` قيمة`null` للزائر أو المستخدم غير المسجل في الكورس.

### شكل بيانات إنشاء الكورس

إضافة وتعديل وحذف الكورسات ورفع صورها محمية وتتطلب حساب`admin`. التسجيل العام ينشئ طالبًا فقط؛ دور المدير يُعطى يدويًا حاليًا.

مثال Body لإنشاء كورس:

```json
{
  "title": "Full-Stack Web Development Bootcamp 2026",
  "category": "Web Development",
  "level": "Intermediate",
  "price": 79.99,
  "duration": "48.5 hours",
  "instructor": "Sarah Jenkins",
  "instructorImage": "/uploads/courses/instructor.jpg",
  "image": "/uploads/courses/course.jpg",
  "label": "Bestseller",
  "published": 9,
  "is_published": true,
  "details": {
    "description": "Build production-ready web applications.",
    "instructorTitle": "Principal Tech Lead",
    "language": "English",
    "subtitles": ["Spanish", "French"],
    "repositoryCount": 184,
    "projectCount": 14,
    "outcomes": ["Build scalable frontend applications."],
    "requirements": ["Basic familiarity with HTML, CSS, and JavaScript."],
    "curriculum": [
      {
        "title": "Modern JavaScript & TypeScript",
        "lessons": [
          "Modern JavaScript essentials",
          {
            "title": "Async code and error handling",
            "description": "Handle asynchronous operations and errors."
          }
        ]
      }
    ]
  }
}
```

`details.curriculum` تحتوي أقسامًا، وكل قسم يحتوي قائمة دروس. الدرس يقبل عنوانًا كنص أو كائنًا فيه`title` واختياريًا`description`.

الـBackend يولّد ويحفظ مرة واحدة عند إنشاء الكورس:`rating` بين 3.5 و5، وعدد طلاب تجريبي، وعدد مراجعات تجريبي، و`favoriteCount` تجريبي بين 100 و5000.`favoriteCount` رقم عرض تجريبي وليس العدد الحقيقي لسجلات المفضلة. عدد الدروس يُحسب من المنهج، و`updatedAt` يتحدد من قاعدة البيانات؛ لا ترسل هذه الحقول عند الإنشاء.

### إنشاء كورس

```http
POST /api/courses
Content-Type: application/json
```

يرجع`201 Created`. يتطلب توكن مدير وCSRF header.

### تعديل كورس

```http
PUT /api/courses/2
Content-Type: application/json
```

أرسل الحقول المراد تحديثها؛ يمكن تعديل بيانات`details` جزئيًا. تعديل`curriculum` مرفوض بعد تسجيل طالب في الكورس أو وجود تقدم محفوظ.

### حذف كورس

```http
DELETE /api/courses/2
```

يتطلب توكن مدير وCSRF header. حذف الكورس يزيل سجلات التسجيل والمفضلة والتقدم التابعة له بفعل علاقات قاعدة البيانات.

### رفع صورة كورس

```http
POST /api/courses/image
```

يتطلب توكن مدير وCSRF header.

في Postman: **Body → form-data**، أضف حقلًا اسمه`image`، وغيّر نوعه إلى **File** واختر الصورة. لا تضبط`Content-Type` يدويًا؛ Postman يحدد`multipart/form-data`.

النجاح يرجع مسارًا مثل:

```json
{
  "success": true,
  "message": "Course image uploaded.",
  "data": {
    "image_url": "/uploads/courses/5d1361c75ebf4172b897864baacb1ddd.jpg"
  }
}
```

استخدم المسار في`image` أو`instructorImage`. لعرضها في المتصفح أضف أصل الباك إند:

```text
http://127.0.0.1:5000/uploads/courses/5d1361c75ebf4172b897864baacb1ddd.jpg
```

الملفات المحلية تُخزن في`instance/uploads/courses`؛ عند النشر على استضافة، يلزم تخزين دائم أو خدمة ملفات لأن نظام الملفات المحلي قد لا يستمر بعد إعادة النشر.

## 6. «كورساتي» وتقدم الدروس

كل مسارات`/api/my-courses` تتطلب JWT صالحًا وبريدًا مؤكدًا. الإضافة والعرض والحذف وتحديث التقدم كلها تتحقق من تأكيد البريد.

### إضافة كورس

```http
POST /api/my-courses
Content-Type: application/json
```

```json
{
  "course_id": 2
}
```

يقبل الكورسات المنشورة فقط. إضافة مكررة ترجع`409 Conflict`. التسجيل في الكورس مستقل عن المفضلة.

### عرض كورساتي مع Pagination

```http
GET /api/my-courses?page=1
```

يعرض بيانات الكورسات كاملة،`enrolledAt`، وحقل`progress`:

كل عنصر كورس يحتوي كمان على`is_favorite` بقيمة`true` أو`false`؛ استخدمها لتحديد شكل زر القلب في «كورساتي» عند ربط الواجهة بالباك إند.

```json
{
  "completedLessons": 1,
  "totalLessons": 2,
  "percentage": 50
}
```

الاستجابة تحتوي`data.items` و`data.pagination` بنفس شكل Pagination الكتالوج، وبـ6 عناصر لكل صفحة.

### تحديث أو إلغاء إنجاز درس

```http
PATCH /api/my-courses/2/lessons/3
Content-Type: application/json
```

```json
{
  "completed": true
}
```

لازم المستخدم يكون مسجلًا في الكورس، والدرس تابعًا له. إرسال`false` يلغي إنجاز الدرس:

```json
{
  "completed": false
}
```

الاستجابة ترجع حالة الدرس ونسبة التقدم الجديدة.

### حذف كورس من «كورساتي»

```http
DELETE /api/my-courses/2
```

يحذف تسجيل المستخدم وتقدمه في دروس ذلك الكورس؛ لو أضافه مرة أخرى يبدأ من الصفر. لا يحذف الكورس من قاعدة البيانات ولا يزيله من المفضلة.

## 7. المفضلة

كل عمليات المفضلة تحتاج JWT صالحًا وبريدًا مؤكدًا. المفضلة مستقلة عن التسجيل في الكورس، ويُسمح بإضافة أي كورس موجود حتى لو غير منشور. تكرار الإضافة يرجع`409`، ومحاولة حذف عنصر غير موجود ترجع`404`.

### إضافة للمفضلة

```http
POST /api/favorites
Content-Type: application/json
```

```json
{
  "course_id": 2
}
```

يرجع بيانات الكورس كاملة. يتطلب CSRF header.

### عرض المفضلة مع Pagination

```http
GET /api/favorites?page=1
```

ترجع بيانات الكورس كاملة، مرتبة من الأحدث حفظًا، ومع Pagination ثابتة من 6 عناصر. تاريخ الحفظ لا يُرسل في الاستجابة.

### حذف من المفضلة

```http
DELETE /api/favorites/2
```

يتطلب CSRF header. حذف الكورس نفسه من قاعدة البيانات يزيل سجلات المفضلة التابعة له.

## 8. أخطاء واستجابات مهمة

| الحالة | معناها المعتاد |
|---|---|
| 400 | Body أو رقم صفحة غير صالح |
| 401 | لا يوجد توكن صالح أو انتهت صلاحيته |
| 403 | البريد غير مؤكد، أو المستخدم غير مسجل في الكورس المطلوب لتحديث تقدمه |
| 404 | الكورس أو الدرس أو سجل المفضلة/التسجيل غير موجود |
| 409 | إضافة كورس مكررة إلى المفضلة أو «كورساتي» |
| 500 | خطأ غير متوقع في السيرفر |

أخطاء JWT والـCSRF قد تستخدم حقل`msg` بدل`message`؛ افحص الاثنين عند عرض رسالة الخطأ في الفرونت.

## 9. أمثلة إعداد الفرونت إند وPostman

### Vite

أنشئ أو حدّث`.env.local` في مشروع الفرونت:

```env
VITE_API_BASE_URL=
```

خلي القيمة فارغة محليًا؛ إعداد Vite يوجّه`/api` و`/uploads` إلى`http://127.0.0.1:5000`. لو غيّرت متغيرات البيئة، أعد تشغيل Vite. في الإنتاج، عيّن`VITE_API_BASE_URL` إلى أصل خدمة الـAPI. عميل الـAPI يستخدم`credentials: "include"`، ويضيف CSRF تلقائيًا، ويقرأ رسائل الأخطاء من`message` أو`msg`.

### تسلسل تجربة Postman

1. سجّل الدخول:`POST /api/auth/login`، وبعدها يَحفظ Postman كوكيز الدخول.
2. تأكد إن الحساب متأكد البريد؛ تسجيل الدخول نفسه يرفض الحساب غير المؤكد.
3. اطلب`GET /api/courses?page=1` وخذ رقم كورس موجودًا.
4. جرّب`POST /api/favorites` مع`{"course_id": 2}`، ثم`GET /api/favorites?page=1`.
5. جرّب`POST /api/my-courses`، ثم`GET /api/my-courses?page=1`.
6. افتح`GET /api/courses/2` وخذ`lesson.id`، ثم حدّثه من مسار PATCH أعلاه.
7. استخدم DELETE لحذف عنصر المفضلة أو التسجيل عند الحاجة.

لا تخلط عنوان`localhost` بعنوان`127.0.0.1` بين Login وبقية الطلبات؛ وإلا قد لا تُرسل الكوكيز.

## 10. سلوك الفرونت إند الحالي

- التسجيل يرسل بيانات الحساب إلى الـAPI، ثم يعرض خانة OTP. صفحة تسجيل الدخول تتيح طلب رمز تأكيد وإدخاله للحساب غير المؤكد.
- تسجيل الدخول يعتمد على كوكي JWT، والـheader يعرض اسم المستخدم ويوفر تسجيل الخروج عند وجود جلسة.
- الصفحة الرئيسية تعرض أول 3 كورسات من الـAPI. صفحة الكورسات والتفاصيل تقرآن من قاعدة البيانات.
- «كورساتي» والمفضلة وتقدم الدروس تُقرأ وتُحدّث في قاعدة البيانات؛ لم تعد عملياتها تحفظ البيانات في`localStorage`.
- الـAPI يرجع 6 عناصر في الصفحة. الفرونت يطلب صفحات الـAPI ويجمع النتائج، ثم يطبق البحث والفلاتر والترتيب ويعرض 6 عناصر في كل صفحة. البحث والفلاتر حاليًا على بيانات الكورسات المحمّلة في الفرونت؛ الـAPI لا يستقبل معاملات بحث أو تصفية.
- `localStorage` ما زال مستخدمًا لإعداد الثيم فقط.
