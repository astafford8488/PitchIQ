"use client";

import { useState } from "react";
import { SmtpForm } from "../profile/SmtpForm";
import { DomainVerifier } from "./DomainVerifier";

type SmtpInitial = {
  smtp_server: string;
  smtp_port: number | string;
  smtp_security: string;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
};

const YOUTUBE_VIDEO_ID = "ZfEK3WP73eY";

type FollowUpInitial = {
  follow_up_days: number;
  max_follow_ups: number;
  follow_up_tone: string;
};

export function EmailSettings({ smtpInitial, followUpInitial }: { smtpInitial: SmtpInitial; followUpInitial: FollowUpInitial }) {
  const [fromEmail, setFromEmail] = useState(smtpInitial.from_email ?? "");

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div className="prose prose-invert prose-sm max-w-none">
          <h3 className="font-semibold mb-2">Setup steps</h3>
          <ol className="list-decimal list-inside space-y-1 text-[var(--muted)] text-sm">
            <li>Pick an SMTP provider (Resend, SendGrid, Brevo, Gmail App Password, etc.)</li>
            <li>Get your SMTP host, port, username, and password from their dashboard</li>
            <li>Use an address from your own domain (e.g. pitches@yourdomain.com) for better deliverability</li>
            <li>Add SPF/DKIM/DMARC records to your domain — use the checker below to verify</li>
            <li>Save settings and click &quot;Test it&quot; to send a test email</li>
          </ol>
        </div>
        <div>
          <a
            href={`https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline text-sm mb-2 inline-block"
          >
            Watch setup video
          </a>
          <div className="aspect-video w-full max-w-lg rounded-lg overflow-hidden bg-[var(--surface)] border border-[var(--border)]">
            <iframe
              title="SMTP setup video"
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
        <SmtpForm
          initial={smtpInitial}
          followUpInitial={followUpInitial}
          onFromEmailChange={setFromEmail}
        />
        <DomainVerifier fromEmail={fromEmail} />
      </div>
    </div>
  );
}
