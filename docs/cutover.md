# Moving mrpia.ch to Firebase Hosting

Until the cutover, `mrpia.ch` and `www.mrpia.ch` are served by Infomaniak's
page builder (Apache at 128.65.195.180). Afterwards they are served by the
Firebase Hosting site `mrpia-home` in project `modern-ally-102412`. DNS stays
at Infomaniak; only the web records change.

Reference: Firebase, "Connect a custom domain",
https://firebase.google.com/docs/hosting/custom-domain

## Why "Advanced setup"

The old site sends `Strict-Transport-Security: max-age=31536000`. Any browser
that has visited mrpia.ch in the last year refuses to load it over a bad
certificate, with no way to click through. Firebase's quick setup issues the
certificate only after the A records point at Firebase, which leaves a window
where the domain answers with the wrong certificate.

Firebase offers Advanced setup for when "you already have a domain receiving
requests on another hosting provider" and "need a zero-downtime migration". You
prove ownership and pass an ACME challenge first, Firebase issues the
certificate, and only then do you move the A records.

## What must not change

These records serve mail and the other apps. Leave them exactly as they are:

| Name | Type | Value (2026-11-22) |
|---|---|---|
| `mrpia.ch` | MX | `5 mta-gw.infomaniak.ch.` |
| `mrpia.ch` | TXT | `v=spf1 include:spf.infomaniak.ch -all` |
| `_dmarc` | TXT | `v=DMARC1; p=reject;` |
| `autodiscover`, `autoconfig` | CNAME | `infomaniak.com.` |
| `mail`, `webmail` | A / CNAME | Infomaniak |
| `math-quizz` | CNAME | `modern-ally-102412.web.app.` |
| `geo-quizz` | CNAME + TXT | `geo-quizz-mrpia.web.app.` |
| `arena-race` | CNAME | `arena-race.web.app.` |
| `arena-maze` | CNAME | `arena-maze.web.app.` |

`mrpia.ch` will end up with two TXT records, the SPF one and Firebase's
`hosting-site=` one. That is fine. Add the new one as a separate record; never
edit it into the SPF string.

## Steps

TTL on the apex A record is 300 seconds, so each change spreads within minutes.

1. **Check the new site.** Open https://mrpia-home.web.app and make sure it is
   the version you want live.

2. **Start the custom domain.** Firebase console → Hosting → site
   `mrpia-home` → *Add custom domain* → `mrpia.ch` → choose **Advanced setup**.
   Leave "redirect" unticked for the apex.

3. **Add the verification records at Infomaniak** (Manager → Domains →
   mrpia.ch → DNS zone). Add exactly what the console shows:
   - a TXT on `mrpia.ch` with the value `hosting-site=mrpia-home`;
   - the ACME challenge TXT (the console shows its name and value).

   Don't touch the A record yet. If the console asks for CAA records, add them
   too; mrpia.ch has none today, so it shouldn't.

4. **Wait for the console** to show ownership verified and the certificate
   issued. This can take from minutes to a few hours.

5. **Switch the apex.** At Infomaniak, delete the A record
   `mrpia.ch → 128.65.195.180` and add the A record(s) the console shows (the
   other apps' `*.web.app` names resolve to 199.36.158.100, but use the
   console's value). Firebase says to remove A, AAAA and CNAME records that
   point to other providers; mrpia.ch has no AAAA today.

6. **Repeat for `www.mrpia.ch`.** In the same site, *Add custom domain* →
   `www.mrpia.ch`, Advanced setup, and tick **redirect to `mrpia.ch`**. Add its
   verification records, wait for the certificate, then replace the A record
   `www → 128.65.195.180` with what the console shows.

7. **Verify.**

   ```sh
   curl -sI https://mrpia.ch/     | grep -iE '^(HTTP|server|x-served-by|content-security)'
   curl -sI https://www.mrpia.ch/ | grep -iE '^(HTTP|location)'
   ```

   Expected: no `server: Apache`; a `content-security-policy` header from
   `firebase.json`; `www` answers with a redirect to `https://mrpia.ch/`.
   Send a mail to info@mrpia.ch to confirm mail still arrives.

## After the cutover

The Infomaniak page builder no longer serves anything. Check in the Infomaniak
Manager whether it belongs to a paid hosting product before cancelling it.
Cancel only the web hosting, never the domain or the mail service. If the
manager has the domain attached to a hosting site, detaching it may rewrite
DNS records, so look at the zone again afterwards.
