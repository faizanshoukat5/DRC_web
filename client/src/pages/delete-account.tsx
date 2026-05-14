import { WebLayout } from "@/components/web-layout";
import { Card } from "@/components/ui/card";
import { Mail, Trash2, Clock, AlertCircle } from "lucide-react";

const CONTACT_EMAIL = "fizu0678@gmail.com";
const RETENTION_DAYS = 30;

export default function DeleteAccountPage() {
  const subject = encodeURIComponent("AEYE Account Deletion Request");
  const body = encodeURIComponent(
    [
      "Hello AEYE Team,",
      "",
      "I would like to request the deletion of my AEYE account and all associated data.",
      "",
      "Account email: <YOUR ACCOUNT EMAIL>",
      "Account role: <patient / doctor>",
      "",
      "Thank you.",
    ].join("\n"),
  );
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

  return (
    <WebLayout title="Delete your AEYE account">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-6">
          <p className="text-base leading-relaxed">
            AEYE is an AI-assisted retinal screening tool for diabetic
            retinopathy, developed by Faizan Shoukat. This page explains how
            to request deletion of your AEYE account and all data associated
            with it.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">How to request deletion</h2>
          </div>
          <ol className="list-decimal list-inside ml-2 space-y-3 text-sm leading-relaxed">
            <li>
              Send an email to{" "}
              <a
                href={mailto}
                className="font-mono text-primary underline break-all"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              from the email address registered to your AEYE account.
            </li>
            <li>
              Use the subject line:{" "}
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                AEYE Account Deletion Request
              </span>
            </li>
            <li>
              In the body, include your account email and role (patient or
              doctor). The pre-filled template (button below) does this for
              you.
            </li>
            <li>
              We will reply within 5 business days to confirm we received your
              request, and complete the deletion within {RETENTION_DAYS} days.
            </li>
          </ol>
          <div className="mt-4">
            <a
              href={mailto}
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
            >
              <Mail className="w-4 h-4" />
              Open pre-filled deletion email
            </a>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">What gets deleted</h2>
          </div>
          <ul className="list-disc list-inside ml-2 space-y-2 text-sm leading-relaxed">
            <li>Your account profile (name, email, phone, date of birth, address, role)</li>
            <li>All fundus images you uploaded</li>
            <li>All AI-generated severity grades, confidence scores, and Grad-CAM heatmaps tied to your account</li>
            <li>Any clinical notes written about your scans (if you are a patient)</li>
            <li>Any follow-up dates scheduled for you</li>
            <li>Your authentication session and stored credentials</li>
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">What may be retained</h2>
          </div>
          <ul className="list-disc list-inside ml-2 space-y-2 text-sm leading-relaxed">
            <li>
              <strong>Anonymous aggregated metrics</strong> (e.g. total scan
              counts across all users) may be retained indefinitely for
              operational analytics. These cannot be linked back to you.
            </li>
            <li>
              <strong>Audit logs</strong> documenting that a deletion request
              was made (without referencing your data) may be retained for up
              to 12 months for compliance purposes.
            </li>
            <li>
              <strong>Backups</strong> of the database that already include
              your data may persist for up to 30 days before being cycled
              out, after which they are permanently overwritten.
            </li>
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Important</h2>
          </div>
          <ul className="list-disc list-inside ml-2 space-y-2 text-sm leading-relaxed">
            <li>
              Deletion is permanent and cannot be reversed. Once we confirm
              completion, your scans, notes, and account cannot be recovered.
            </li>
            <li>
              Send the request from the email address registered to your
              account so we can verify the request is genuine. If you no
              longer have access to that address, include enough information
              (full name, approximate sign-up date, doctor's name if you are
              a patient) to verify your identity.
            </li>
            <li>
              If you are a patient currently assigned to a doctor, your
              doctor will be notified that the patient record no longer
              exists, but no patient data will be shared with them.
            </li>
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Contact</h2>
          </div>
          <p className="text-sm leading-relaxed">
            For account deletion or any other privacy-related question:
          </p>
          <p className="mt-2 font-mono text-sm bg-slate-100 dark:bg-slate-800 p-3 rounded break-all">
            {CONTACT_EMAIL}
          </p>
        </Card>
      </div>
    </WebLayout>
  );
}
