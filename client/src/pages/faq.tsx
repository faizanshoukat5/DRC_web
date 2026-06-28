import { motion } from "framer-motion";
import { WebLayout } from "@/components/web-layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { 
  HelpCircle, 
  ScanEye, 
  Shield, 
  Upload, 
  Users, 
  FileText,
  Clock,
  Lock,
  Stethoscope,
  UserRound,
  Building2,
  AlertCircle
} from "lucide-react";

const faqCategories = [
  {
    title: "General",
    icon: HelpCircle,
    color: "bg-primary/10 text-primary",
    questions: [
      {
        q: "What is A-EYE?",
        a: "A-EYE is an app that uses AI to screen for diabetic retinopathy — a diabetes-related eye condition. A doctor uploads a photo of your retina and the AI checks it for signs of damage in about 45 seconds. Results are shared with both you and your doctor."
      },
      {
        q: "Is A-EYE a replacement for my eye doctor?",
        a: "No — and this is important. A-EYE is a screening tool that helps doctors catch potential issues early. It is not a diagnosis. Your doctor always makes the final call on your eye health."
      },
      {
        q: "What is diabetic retinopathy?",
        a: "It's an eye complication of diabetes. Over time, high blood sugar can damage tiny blood vessels in the back of the eye and affect your vision. The good news is that when caught early it can usually be managed — which is exactly what A-EYE helps with."
      },
      {
        q: "How reliable is the AI?",
        a: "The AI has been trained on thousands of real retinal images and performs well at detecting signs of diabetic retinopathy. That said, no AI is perfect, so every result is meant to be reviewed by your doctor before any decisions are made."
      },
    ]
  },
  {
    title: "For Patients",
    icon: UserRound,
    color: "bg-emerald-100 text-emerald-700",
    questions: [
      {
        q: "How do I get started?",
        a: "Sign up, choose 'Patient', and fill in your basic details. You'll then pick a doctor from our list of approved doctors. Once connected, your doctor can run scans and share results with you — no extra steps needed on your side."
      },
      {
        q: "Can I upload images myself?",
        a: "Not at the moment. Your doctor handles image uploads to make sure the photos are good quality and the process follows proper medical guidelines. You'll see all your results in your dashboard as soon as they're ready."
      },
      {
        q: "Where do I find my results?",
        a: "Your latest result shows up on your home screen as soon as your doctor analyses a scan. Click on it to see the full report — including what level of DR was found, your doctor's notes, and any follow-up date."
      },
      {
        q: "What is the progression tracker?",
        a: "It compares your latest scan to your previous one and tells you if things have gotten better, stayed the same, or need more attention. It's a quick way to see your eye health trend over time."
      },
      {
        q: "Can I switch doctors?",
        a: "Yes. Go to Select Doctor from your dashboard to connect with a different doctor whenever you need to."
      },
      {
        q: "How do I delete my account?",
        a: "Email us at fizu0678@gmail.com with the subject 'AEYE Account Deletion Request' from your registered email address. We'll confirm within 5 business days and delete everything within 30 days. Full instructions are on the Delete Account page."
      },
    ]
  },
  {
    title: "For Doctors",
    icon: Stethoscope,
    color: "bg-blue-100 text-blue-700",
    questions: [
      {
        q: "How do I sign up as a doctor?",
        a: "Choose 'Doctor' when signing up and enter your licence number and specialty. Our team verifies your details — usually within 1–3 business days — and you'll get a notification once your account is approved."
      },
      {
        q: "How do I run a scan for a patient?",
        a: "From your dashboard, find the patient, upload a clear retinal image, and click Analyse. You'll get the result — including the severity level, confidence percentage, and a heatmap — in under 45 seconds."
      },
      {
        q: "Can I write notes and set follow-up dates?",
        a: "Yes. On any result page you can add your clinical notes and pick a follow-up date. The patient will see your notes and the follow-up reminder on their dashboard."
      },
      {
        q: "Can I track how a patient's condition is changing?",
        a: "Yes. The results page shows whether things have worsened, improved, or stayed stable compared to the last scan. In the scan history list, each entry has a colour-coded badge so you can spot trends at a glance."
      },
    ]
  },
  {
    title: "Privacy & Security",
    icon: Shield,
    color: "bg-amber-100 text-amber-700",
    questions: [
      {
        q: "Is my data safe?",
        a: "Yes. All your information is encrypted — both when it's being sent and when it's stored. Patients can only see their own records, and doctors can only see records of patients connected to them. Nobody else has access."
      },
      {
        q: "Are my retinal images stored?",
        a: "Your images are stored securely in your account so you and your doctor can access them later. When the AI analyses an image, it processes it in memory and doesn't keep a separate copy — only the result is saved."
      },
      {
        q: "What data does A-EYE collect?",
        a: "We collect the basics needed to run the app — your name, email, and role — plus any retinal images and results linked to your account. We never sell your data or use it for advertising."
      },
      {
        q: "Is A-EYE available on Android?",
        a: "Yes. A-EYE is available on Android via the Google Play Store. This web version is also available so you can use it from any browser without installing anything."
      },
    ]
  },
  {
    title: "Understanding Your Results",
    icon: FileText,
    color: "bg-purple-100 text-purple-700",
    questions: [
      {
        q: "What do the severity levels mean?",
        a: "There are 5 levels: No DR (no signs — great!), Mild (very early signs), Moderate (more noticeable changes), Severe (significant changes that need attention), and Proliferative DR (the most advanced stage — urgent referral needed). Your doctor will explain what the result means for you specifically."
      },
      {
        q: "What is the confidence percentage?",
        a: "It shows how sure the AI is about its result. A high percentage means the AI is confident. A lower number doesn't mean the result is wrong — it often just means the image was borderline or the photo quality could be better. Your doctor takes this into account."
      },
      {
        q: "What is the heatmap?",
        a: "It's a coloured highlight on your retinal image showing which parts of the eye the AI focused on. Warmer colours (red, orange) mark the areas of most concern. It helps your doctor quickly verify what the AI noticed and decide whether they agree."
      },
      {
        q: "Can I download my report?",
        a: "Yes. Open any scan result and click Share PDF Report. You'll get a PDF with the image, AI result, your doctor's notes, and the follow-up date — useful to bring to other appointments or keep for your records."
      },
      {
        q: "Should I be worried if my result is not No DR?",
        a: "Not necessarily — that's why you have a doctor. A-EYE flags things that need a closer look, but only your doctor can tell you what the result means for your health and what steps, if any, to take."
      },
    ]
  },
];

export default function FAQPage() {
  return (
    <WebLayout title="FAQ">
      <div className="min-h-full p-5 space-y-6 bg-slate-50 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Frequently Asked Questions
              </h1>
              <p className="text-sm text-slate-500">
                Common questions about A-EYE, answered simply
              </p>
            </div>
          </div>
        </motion.div>

        {/* FAQ Categories */}
        <div className="space-y-4">
          {faqCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.05 }}
            >
              <Card className="p-4 border-slate-200/70 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${category.color}`}>
                    <category.icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {category.title}
                  </h2>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`${category.title}-${index}`}
                      className="border-slate-200"
                    >
                      <AccordionTrigger className="text-left text-sm font-medium text-slate-800 hover:text-primary hover:no-underline py-3">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-slate-600 leading-relaxed pb-4">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-5 border-slate-200/70 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900">
                  Still have questions?
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Email us at <span className="font-medium text-primary">fizu0678@gmail.com</span> and we'll get back to you as soon as we can.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </WebLayout>
  );
}
