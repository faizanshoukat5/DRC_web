import { WebLayout } from "@/components/web-layout";
import { Card } from "@/components/ui/card";
import { Shield, Database, Lock, UserCheck, Mail, AlertTriangle } from "lucide-react";

const LAST_UPDATED = "May 12, 2026";

export default function PrivacyPage() {
  return (
    <WebLayout title="Privacy Policy">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Last updated: {LAST_UPDATED}</p>
          <p className="text-base leading-relaxed">
            AEYE ("we", "our", "the app") is an AI-assisted retinal screening tool for
            diabetic retinopathy. This Privacy Policy explains what information we
            collect, how we use it, and the choices you have. AEYE is a screening aid
            that supports qualified medical practitioners and is not a substitute for
            professional medical advice, diagnosis, or treatment.
          </p>
        </Card>

        <Section icon={Database} title="1. Information We Collect">
          <h3 className="font-semibold mt-2">Account information</h3>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Email address (for sign-in)</li>
            <li>Full name</li>
            <li>Phone number (optional)</li>
            <li>Role: patient, doctor, or administrator</li>
            <li>For doctors: license number and specialty</li>
            <li>For patients: date of birth, gender, address (optional)</li>
          </ul>

          <h3 className="font-semibold mt-4">Health information</h3>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Fundus (retinal) photographs you or your doctor upload</li>
            <li>AI-generated severity grades and confidence scores</li>
            <li>Grad-CAM heatmaps generated from your scans</li>
            <li>Clinical notes written by your doctor</li>
            <li>Follow-up dates scheduled by your doctor</li>
          </ul>

          <h3 className="font-semibold mt-4">Device and usage information</h3>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Device model and operating system version</li>
            <li>App version and crash logs (to fix bugs)</li>
            <li>Authentication session tokens (stored on your device)</li>
          </ul>
        </Section>

        <Section icon={UserCheck} title="2. How We Use Your Information">
          <ul className="list-disc list-inside ml-2 space-y-2">
            <li>To authenticate you and maintain your session</li>
            <li>To run AI inference on your fundus images and return a screening result</li>
            <li>To store your scan history so you and your doctor can review trends</li>
            <li>To allow your assigned doctor to view your scans and write clinical notes</li>
            <li>To allow administrators to approve doctor registrations</li>
            <li>To send password-reset emails when you request them</li>
            <li>To improve app stability through anonymized crash reports</li>
          </ul>
          <p className="mt-3 text-sm">
            We do <strong>not</strong> use your data to train or improve the AI model.
            We do <strong>not</strong> sell your data. We do <strong>not</strong> show
            you ads.
          </p>
        </Section>

        <Section icon={Lock} title="3. How Your Data Is Stored">
          <ul className="list-disc list-inside ml-2 space-y-2">
            <li>All data is stored on Supabase infrastructure with encryption at rest (AES-256) and in transit (TLS 1.2+).</li>
            <li>Fundus images are kept in private, access-controlled storage buckets.</li>
            <li>Row-Level Security (RLS) policies on the database ensure patients can only access their own records; doctors can only access records of patients assigned to them.</li>
            <li>AI inference runs on a hosted FastAPI service (Hugging Face Spaces). Images are processed in memory and not retained on the inference server.</li>
            <li>Authentication tokens are stored locally on your device using secure storage (Expo SecureStore on mobile, browser storage on web).</li>
          </ul>
        </Section>

        <Section icon={Shield} title="4. Who Can See Your Data">
          <ul className="list-disc list-inside ml-2 space-y-2">
            <li><strong>You.</strong> Patients see only their own scans.</li>
            <li><strong>Your assigned doctor.</strong> If you select a doctor, that doctor can view your scans and write notes.</li>
            <li><strong>Administrators.</strong> System administrators can view profile records to manage doctor approvals. They do not routinely access scan images.</li>
            <li><strong>Service providers.</strong> Our subprocessors (Supabase for storage/auth, Hugging Face for inference, email providers for password resets) process data on our behalf under their own data protection terms.</li>
          </ul>
          <p className="mt-3 text-sm">
            We do not share your information with advertisers, marketers, or analytics
            companies. We will not sell your data.
          </p>
        </Section>

        <Section icon={UserCheck} title="5. Your Rights">
          <ul className="list-disc list-inside ml-2 space-y-2">
            <li><strong>Access.</strong> You can view your profile, scans, and follow-ups in the app at any time.</li>
            <li><strong>Correction.</strong> You can edit your profile information in Settings.</li>
            <li><strong>Deletion.</strong> You can request deletion of your account and all associated scans by emailing us. We honour deletion requests within 30 days.</li>
            <li><strong>Export.</strong> You can download PDF reports of any scan from the results screen.</li>
            <li><strong>Withdraw consent.</strong> You can stop using the app and sign out at any time.</li>
          </ul>
        </Section>

        <Section icon={AlertTriangle} title="6. Important Disclaimers">
          <ul className="list-disc list-inside ml-2 space-y-2">
            <li>AEYE is <strong>not</strong> a medical device and has not been cleared by the FDA, CE, MHRA, or any other regulator for diagnostic use.</li>
            <li>The AI screening result is <strong>not a diagnosis</strong>. Final clinical interpretation must always be made by a qualified ophthalmologist or healthcare professional.</li>
            <li>Do not rely on AEYE alone to make treatment decisions.</li>
            <li>AEYE is not certified under HIPAA. If you operate in a HIPAA-regulated environment, ensure your organization's Business Associate Agreements cover Supabase and any other subprocessors.</li>
          </ul>
        </Section>

        <Section icon={Database} title="7. Data Retention">
          <p>
            We retain scans and account data for as long as your account is active.
            When you request deletion, we permanently remove your scans and profile
            within 30 days. Anonymous, aggregated metrics (e.g. total scan counts)
            may be retained for operational analytics.
          </p>
        </Section>

        <Section icon={UserCheck} title="8. Children's Privacy">
          <p>
            AEYE is intended for adult patients and licensed healthcare practitioners.
            We do not knowingly collect information from anyone under 18 without
            explicit consent from a parent or legal guardian.
          </p>
        </Section>

        <Section icon={Shield} title="9. International Users">
          <p>
            AEYE is operated from servers hosted globally by Supabase. If you use the
            app from outside the United States, your information may be transferred
            to and processed in the country where our servers are located. By using
            AEYE you consent to this transfer.
          </p>
        </Section>

        <Section icon={Mail} title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify users
            of material changes through an in-app banner or via email. Continued use
            of AEYE after a change constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section icon={Mail} title="11. Contact Us">
          <p>
            For privacy questions, data access requests, or deletion requests, contact us at:
          </p>
          <p className="mt-2 font-mono text-sm bg-slate-100 dark:bg-slate-800 p-3 rounded">
            fizu0678@gmail.com
          </p>
          <p className="mt-3 text-sm">
            To request account deletion specifically, see our dedicated
            page: <a href="/delete-account" className="text-primary underline">Delete my AEYE account</a>.
          </p>
        </Section>
      </div>
    </WebLayout>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="text-sm leading-relaxed space-y-2 text-slate-700 dark:text-slate-300">
        {children}
      </div>
    </Card>
  );
}
