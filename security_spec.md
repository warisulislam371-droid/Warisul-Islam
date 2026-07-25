# Firebase Security Specification & TDD Test Runner

## 1. Data Invariants
- **Vendor Identity Invariant**: A vendor can only read or write vendor documents (`vendorDocuments`) and product image records (`productImages`) where `vendorId == request.auth.uid`.
- **Admin Supremacy Invariant**: Administrative roles (authenticated users identified in `/users` or `/admins` as `role == 'super_admin'` or `role == 'admin'`) can inspect, verify, approve, reject, or delete any vendor document or product image.
- **Product Image Integrity**: A customer can read approved product images, but cannot modify or upload product images.
- **Verification Privacy Invariant**: Verification documents (`vendorDocuments`) contain sensitive PII (GST, PAN, Bank Cheques) and can NEVER be read by unauthenticated users or customers.
- **File Size and Extension Enforcements**: Image uploads must be limited in record metadata to valid formats (`jpg`, `png`, `webp`) and sizes under 10MB (10485760 bytes).

## 2. The Dirty Dozen Security Attack Payloads

1. **Payload 1 (Identity Spoofing - Vendor Document Creation)**
   - Attacker attempts to create a vendor document under another vendor's `vendorId`.
   - Payload: `{ vendorId: "victim_vendor_123", documentType: "panCard", fileUrl: "https://hacker.com/fake_pan.jpg" }`
   - Expected Result: `PERMISSION_DENIED`

2. **Payload 2 (Ghost Field Injection / Shadow Update)**
   - Vendor attempts to update document status to "Approved" directly.
   - Payload: `{ status: "Approved", remarks: "Auto approved by hacker" }`
   - Expected Result: `PERMISSION_DENIED`

3. **Payload 3 (Unauthorized PII Scraping)**
   - Unauthenticated user or customer attempts to query `/vendorDocuments`.
   - Query: `db.collection('vendorDocuments').get()`
   - Expected Result: `PERMISSION_DENIED`

4. **Payload 4 (Oversized Payload / Denial of Wallet)**
   - Attacker attempts to inject 5MB text string into document name field.
   - Payload: `{ documentName: "A".repeat(5000000) }`
   - Expected Result: `PERMISSION_DENIED`

5. **Payload 5 (Unapproved Product Image Injection)**
   - Customer attempts to inject unapproved images into a live product.
   - Payload: `{ productId: "prod_1", secureUrl: "https://evil.com/phishing.png", status: "Approved" }`
   - Expected Result: `PERMISSION_DENIED`

6. **Payload 6 (Cross-Vendor Product Image Mutation)**
   - Vendor A attempts to delete Vendor B's product images.
   - Action: `deleteDoc(doc(db, "productImages", "vendor_b_image_id"))`
   - Expected Result: `PERMISSION_DENIED`

7. **Payload 7 (Role Escalation in Users Profile)**
   - Customer attempts to update their own role to `super_admin`.
   - Payload: `{ role: "super_admin" }`
   - Expected Result: `PERMISSION_DENIED`

8. **Payload 8 (Invalid File Type Injection)**
   - Vendor attempts to register an executable `.exe` as a product image asset.
   - Payload: `{ format: "exe", secureUrl: "http://malware.com/virus.exe" }`
   - Expected Result: `PERMISSION_DENIED`

9. **Payload 9 (Terminal Verification State Override)**
   - Vendor attempts to override a rejected document status back to "Approved" without admin review.
   - Payload: `{ status: "Approved" }`
   - Expected Result: `PERMISSION_DENIED`

10. **Payload 10 (Path Poisoning via Malformed Doc ID)**
    - Attacker attempts to pass a 2KB junk character ID string for a document path.
    - Path: `/vendorDocuments/!!!<script>alert(1)</script>...`
    - Expected Result: `PERMISSION_DENIED`

11. **Payload 11 (Unauthenticated Admin Clearance Execution)**
    - Unauthenticated client attempts to approve payout clearance.
    - Action: `updateDoc(doc(db, "clearance_requests", "CLR-1"), { status: "Approved" })`
    - Expected Result: `PERMISSION_DENIED`

12. **Payload 12 (Invalid Cloudinary URL Protocol)**
    - Vendor attempts to set a non-HTTPS malicious URL for product image.
    - Payload: `{ secureUrl: "javascript:alert('xss')" }`
    - Expected Result: `PERMISSION_DENIED`

## 3. Security Rule Design Blueprint
All 12 payloads are guaranteed to fail through rule-level attribute checking, schema length enforcement, and role evaluation in `firestore.rules`.
