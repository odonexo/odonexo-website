import type { SiteSettings } from "@/lib/types/site-settings";

const aboutSq = `Me 35 vite përvojë në drejtimin e laboratorëve dhe klinikave, i kushtuam vëmendje problematikës që na ka shqetësuar më shumë. Edhe laboratorët dhe klinikat më të specializuara hasin vështirësi të mëdha nga defektet e papritura të materialeve dhe makinerive. Kur çështja është në Shqipëri, shpesh nuk mbetet kohë për t'i zgjidhur. Prandaj na është dashur të mbajmë një CAD/CAM rezervë, kompresor ose materiale në stok. Pajisjet pa servis të menjëhershëm dhe mungesa e materialeve me vazhdimësi kanë krijuar shumë stres.

Për t'u çliruar nga këto probleme krijuam markën tonë dhe një zinxhir të plotë furnizimi. Materialet dhe makineritë cilësore i kemi testuar vetë, me paritet të përshtatshëm çmimi, që të punojnë në harmoni dhe pa probleme. Këtë cilësi e hapim për kolegët tanë me transparencë dhe mbështetje të plotë servisi. Kemi formuar ekip të plotë. Jeni gati për të punuar pa stres?

Në kuadër të Art Dent, në Korçë dhe Tiranë, me 7 mjekë specialistë, 2 kirurgë, 1 profesor doktor dhe një ekip laboratori me 45 specialistë, shërbejmë prej vitesh. Tani nën emrin e ri odonexo ofrojmë materiale të prodhimit të specializuar, vegla dore dhe makineri me porosi online. Faleminderit për besimin që na dini: me rrjet të plotë servisi dhe produkte të garantuara. odonexo.com mbështet punën tuaj pa stres dhe të besueshme me materiale e pajisje cilësore.

Ofrojmë dorëzim dhe servis brenda ditës në çdo pikë të Shqipërisë; mbështetje kirurgjikale për implantet; mbështetje me laser, titan bar blender dhe Exocad në laborator që të dorëzoni punë pa problem. Për pacientë të ardhur nga jashtë, pjesët e panjohura të implantit (analog, transfer, abutment, MUA dhe çdo pjesë tjetër) i furnizojmë nga odonexo.com.`;

const aboutEn = `With 35 years of experience running laboratories and clinics, we focused on the issue that stressed us most. Even specialized labs and clinics face serious problems from unexpected material and equipment failures. In Albania, there is often no time left to solve them. That is why we had to keep a spare CAD/CAM, compressor or materials in stock. Devices without immediate service and materials without continuity created a lot of stress.

To move past these problems we built our own brand and a complete supply chain. We tested quality materials and machines ourselves, at fair price parity, so they work together smoothly. We share this quality with our colleagues with full transparency and service support. We built a complete team. Are you ready to work without stress?

Under Art Dent in Korça and Tirana, with 7 specialist doctors, 2 surgeons, 1 professor doctor and a 45-person laboratory team, we have served for years. Now under the new name odonexo we offer specialized production materials, hand instruments and machines via online ordering. Thank you in advance for the trust — with a full service network and guaranteed products. odonexo.com supports stress-free, reliable work with quality materials and equipment.

We provide same-day delivery and service across Albania; surgical support for implants; and laser, titan bar blender and Exocad support in the lab so you can deliver work without issues. For patients coming from elsewhere, unknown implant parts (analog, transfer, abutment, MUA and any other parts) can be supplied from odonexo.com.`;

const aboutTr = `Biz 35 yıllık laboratuvar ve klinik işletme tecrübesiyle en çok zorluk çektiğimiz konuya el attık. Laboratuvar ve kliniklerin, ne kadar uzman olsalar da, sarf malzeme ve makinelerde çıkan beklenmedik arızalardan ciddi sorunlar yaşadık. Hele ki mesele Arnavutluk olduğunda bu tür sorunları çözecek vaktiniz de olmaz. Dolayısıyla bir CAD/CAM gerekirken ikincisini yedekte tutmamız, kompresör veya malzeme stokta bulundurmamız gerekti. Anında servis alamadığımız cihazlar; malzemelerde sürekliliği olmayan ya da az giden malzemeleri bulamamak gibi sorunlar çok stres yarattı.

Şimdi bu sorunlardan kurtulmak için kendi markamızı oluşturup tam bir tedarik zinciri kurduk. Fiyat paritesi uygun, kaliteli malzemeleri ve makineleri kendimiz test edip tam uyumlu, sorunsuz çalışacak şekilde seçtik. Bu kaliteyi şeffaf ve her türlü servis desteğiyle meslektaşlarımızla paylaşıma açıyoruz. Tam bir ekip kurduk. Siz de sorunsuz çalışmaya hazır mısınız?

Art Dent bünyesinde Korça ve Tiran'da 7 uzman hekim, 2 cerrah, 1 profesör doktor ve 45 kişilik laboratuvar uzman ekibimizle yıllardır hizmet veriyoruz. Artık yeni kurduğumuz odonexo adı altında özel üretim malzeme, el aletleri ve makineleri internet siparişi üzerinden kullanımınıza sunuyoruz. Tam bir servis ağıyla garantili ürünlerle çalışmanız için duyduğunuz güvene şimdiden teşekkürler. odonexo.com olarak iyi malzeme ve ekipmanla stressiz, güvenilir çalışmanızı destekliyoruz.

Arnavutluk'un her noktasına gün içinde teslim ve servis hizmeti; implantlarda cerrahi destek; laboratuvar alanında lazer, titan bar blender ve Exocad desteğiyle sorunsuz iş teslim etmenizi sağlıyoruz. Başka yerden gelmiş hastanızda bilmediğiniz implant parçalarını (analog, transfer, abutment, MUA ve her türlü parçayı) odonexo.com'dan tedarik edebiliriz.`;

export const defaultSiteSettings: SiteSettings = {
  phone: "+355 69 500 0000",
  whatsapp: "355695000000",
  telegram: "odonexo",
  email: "info@odonexo.com",
  address: "Korçë / Tiranë, Albania",
  hours: "Pzt - Cuma: 09:00 - 18:00\nCumartesi: 09:00 - 14:00",
  facebook: "",
  instagram: "",
  linkedin: "",
  tiktok: "",
  aboutContentSq: aboutSq,
  aboutContentEn: aboutEn,
  aboutContent: aboutTr,
  shippingPolicySq:
    "Porositë tuaja përgatiten sa më shpejt sipas stokut dhe zonës së dorëzimit. Informacioni i transportit ndahet pasi të aprovohet porosia.",
  shippingPolicyEn:
    "Your orders are prepared as soon as possible based on stock and delivery area. Shipping details are shared once your order is approved.",
  shippingPolicy:
    "Siparişleriniz, stok ve teslimat bölgesine göre en kısa sürede hazırlanır. Kargo bilgisi siparişiniz onaylandığında sizinle paylaşılır.",
  returnsPolicySq:
    "Për kthim ose ndërrim na kontaktoni. Produkti duhet të jetë i papërdorur dhe në ambalazhin origjinal.",
  returnsPolicyEn:
    "Contact us for returns or exchanges. The product must be unused and in its original packaging.",
  returnsPolicy:
    "İade veya değişim talebiniz için bizimle iletişime geçin. Ürünün kullanılmamış ve orijinal ambalajında olması gerekir.",
  privacyPolicySq:
    "Të dhënat tuaja personale përdoren vetëm për përpunimin e porosisë, dorëzimin dhe komunikimin me klientin. Nuk ndahen me palë të treta për marketing.",
  privacyPolicyEn:
    "Your personal data is used only to process your order, delivery and customer communication. It is not shared with third parties for marketing.",
  privacyPolicy:
    "Kişisel bilgileriniz yalnızca siparişinizi işlemek, teslimat ve müşteri iletişimi için kullanılır. Bilgileriniz üçüncü kişilerle pazarlama amacıyla paylaşılmaz.",
  freeShippingMinEur: 50,
  shippingCostEur: 5,
  onlinePaymentEnabled: false,
  paymentProvider: "none",
  showVisa: true,
  showMastercard: true,
  showTroy: true,
  posApiBaseUrl: "",
  posMerchantId: "",
  posApiKey: "",
  telegramBotToken: "",
  telegramChatId: "",
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  smtpFrom: "",
};
