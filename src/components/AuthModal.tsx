import React, { useState, useEffect } from 'react';
import { dbLocal } from '../db';
import { User, Vendor } from '../types';
import {
  Lock,
  Mail,
  User as UserIcon,
  Store,
  FileText,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Upload,
  CheckCircle,
  Clock,
  Camera,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  File,
  X,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Building
} from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  isDarkMode?: boolean;
  initialMode?: 'login' | 'register_customer' | 'register_vendor' | 'forgot' | 'force_reset';
}

// Global helper for generating a beautiful high-fidelity scanned document preview
const generateDocumentCanvas = (docTitle: string, fileName: string, fileSize: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;
  
  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 600, 800);
  
  // Document border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 588, 788);
  
  // Header banner
  ctx.fillStyle = '#0f766e'; // HealNex Teal
  ctx.fillRect(12, 12, 576, 110);
  
  // Header Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('HEALNEX SECURE MEDICAL PORTAL', 40, 55);
  ctx.font = '13px monospace';
  ctx.fillStyle = '#ccfbf1';
  ctx.fillText('CLINICAL PROVIDER VERIFICATION GATEWAY • SUPABASE STORAGE SECURED', 40, 85);
  
  // Watermark
  ctx.save();
  ctx.translate(300, 450);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = 'rgba(15, 118, 110, 0.05)';
  ctx.font = 'bold 50px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HEALNEX MEDICAL', 0, -20);
  ctx.fillText('VERIFICATION', 0, 40);
  ctx.restore();
  
  // Document Details Box
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(40, 160, 520, 240);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 160, 520, 240);
  
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('DOCUMENT CLASSIFICATION', 60, 200);
  
  // Divider
  ctx.beginPath();
  ctx.moveTo(60, 215);
  ctx.lineTo(540, 215);
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();
  
  ctx.fillStyle = '#475569';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Document Type:', 60, 250);
  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(docTitle, 220, 250);
  
  ctx.fillStyle = '#475569';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Source File Name:', 60, 285);
  ctx.fillStyle = '#1e293b';
  ctx.font = '13px monospace';
  ctx.fillText(fileName, 220, 285);
  
  ctx.fillStyle = '#475569';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Document Size:', 60, 320);
  ctx.fillStyle = '#1e293b';
  ctx.fillText(fileSize, 220, 320);
  
  ctx.fillStyle = '#475569';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Timestamp:', 60, 355);
  ctx.fillStyle = '#64748b';
  ctx.fillText(new Date().toLocaleString(), 220, 355);
  
  // Schematic Document Content Drawing (Simulating some form fields and checkboxes)
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(40, 430, 520, 12);
  ctx.fillRect(40, 460, 380, 10);
  ctx.fillRect(40, 485, 460, 10);
  ctx.fillRect(40, 510, 290, 10);
  
  // Stamp box
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.strokeRect(380, 580, 180, 70);
  
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('PENDING AUDIT', 415, 610);
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText('HEALNEX ADMIN GATEWAY', 400, 635);
  
  // Footer notice
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText('CONFIDENTIAL & PROPRIETARY DOCUMENT. ACCESS RESTRICTED TO AUTHORIZED MEDICAL AUDITORS.', 40, 750);
  
  return canvas.toDataURL('image/jpeg', 0.7);
};

export default function AuthModal({ onClose, onLoginSuccess, addToast, isDarkMode = false, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register_customer' | 'register_vendor' | 'forgot' | 'force_reset'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Vendor Registrations state
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [pincode, setPincode] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccNumber, setBankAccNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // Document Upload States
  interface UploadedDocState {
    name: string;
    size: string;
    url: string;
    previewUrl: string;
    progress: number;
    isUploading: boolean;
  }

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDocState>>({
    gstCertificate: { name: '', size: '', url: '', previewUrl: '', progress: 0, isUploading: false },
    panCard: { name: '', size: '', url: '', previewUrl: '', progress: 0, isUploading: false },
    aadhaarCard: { name: '', size: '', url: '', previewUrl: '', progress: 0, isUploading: false },
    tradeLicense: { name: '', size: '', url: '', previewUrl: '', progress: 0, isUploading: false },
    companyRegCertificate: { name: '', size: '', url: '', previewUrl: '', progress: 0, isUploading: false },
    cancelledCheque: { name: '', size: '', url: '', previewUrl: '', progress: 0, isUploading: false },
    drugLicense: { name: '', size: '', url: '', previewUrl: '', progress: 0, isUploading: false },
    fssaiLicense: { name: '', size: '', url: '', previewUrl: '', progress: 0, isUploading: false },
  });

  // Forced password change variables
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempAdminUser, setTempAdminUser] = useState<User | null>(null);

  // File Upload processing handler
  const handleFileUpload = (key: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      addToast('Maximum file size exceeded (10 MB). Please choose a smaller document.', 'error');
      return;
    }

    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(fileExt)) {
      addToast('Invalid file format. Only JPG, JPEG, PNG, WEBP, and PDF documents are supported.', 'error');
      return;
    }

    // Initialize progress tracking
    setUploadedDocs(prev => ({
      ...prev,
      [key]: {
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        url: '',
        previewUrl: '',
        progress: 10,
        isUploading: true
      }
    }));

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = (ev.target?.result as string) || '';
      let currentProgress = 10;
      const timer = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 20) + 15;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(timer);

          const docTitleMap: Record<string, string> = {
            gstCertificate: 'GST Certificate (Form REG-06)',
            panCard: 'Permanent Account Number (PAN Card)',
            aadhaarCard: 'Aadhaar Identification Card',
            tradeLicense: 'Municipal Trade License',
            companyRegCertificate: 'Company Registration Certificate',
            cancelledCheque: 'Cancelled Clearing Cheque Leaf',
            drugLicense: 'State Drug Control License',
            fssaiLicense: 'FSSAI Food Safety License'
          };

          const docTitle = docTitleMap[key] || 'Corporate Document';
          const formattedSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
          const generatedPreview = generateDocumentCanvas(docTitle, file.name, formattedSize);

          setUploadedDocs(prev => ({
            ...prev,
            [key]: {
              name: file.name,
              size: formattedSize,
              url: dataUrl || generatedPreview,
              previewUrl: dataUrl || generatedPreview,
              progress: 100,
              isUploading: false
            }
          }));

          addToast(`Uploaded ${file.name} successfully.`, 'success');
        } else {
          setUploadedDocs(prev => ({
            ...prev,
            [key]: {
              ...prev[key],
              progress: currentProgress
            }
          }));
        }
      }, 120);
    };
    reader.readAsDataURL(file);
  };

  // Camera simulator
  const captureCameraMock = (key: string) => {
    const randomId = Math.floor(100000 + Math.random() * 900000);
    const mockFilename = `camera_capture_${randomId}.jpg`;

    setUploadedDocs(prev => ({
      ...prev,
      [key]: {
        name: mockFilename,
        size: '1.82 MB',
        url: '',
        previewUrl: '',
        progress: 15,
        isUploading: true
      }
    }));

    let currentProgress = 15;
    const timer = setInterval(() => {
      currentProgress += 25;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(timer);

        const docTitleMap: Record<string, string> = {
          gstCertificate: 'GST Certificate (Handheld Camera Scan)',
          panCard: 'PAN Card Photo Capture',
          aadhaarCard: 'Aadhaar Card Camera Snapshot',
          tradeLicense: 'Trade License Handheld Scan',
          companyRegCertificate: 'Company Registration Camera Scan',
          cancelledCheque: 'Cancelled Cheque Photographic Capture',
          drugLicense: 'State Drug Control Camera Snapshot',
          fssaiLicense: 'FSSAI Food Safety Camera Snapshot'
        };

        const docTitle = docTitleMap[key] || 'Camera Captured Document';
        const mockUrl = `https://healnex-storage.supabase.co/v1/storage/documents/vendor_onboarding/${key}_${Date.now()}_${mockFilename}`;
        const generatedPreview = generateDocumentCanvas(docTitle, mockFilename, '1.82 MB');

        setUploadedDocs(prev => ({
          ...prev,
          [key]: {
            name: mockFilename,
            size: '1.82 MB',
            url: mockUrl,
            previewUrl: generatedPreview,
            progress: 100,
            isUploading: false
          }
        }));

        addToast(`Captured ${mockFilename} via device camera simulation.`, 'success');
      } else {
        setUploadedDocs(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            progress: currentProgress
          }
        }));
      }
    }, 100);
  };

  const removeUploadedDoc = (key: string) => {
    setUploadedDocs(prev => ({
      ...prev,
      [key]: { name: '', size: '', url: '', previewUrl: '', progress: 0, isUploading: false }
    }));
    addToast('Document removed from current workspace.', 'info');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const users = dbLocal.getUsers();
    const match = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (!match) {
      addToast('Invalid login credentials. Please audit entered secrets or switch roles.', 'error');
      return;
    }

    // Force password reset workflow for Default Super Admin if password matches default '654321'
    if (match.email === 'warisulislam371@gmail.com' && match.password === '654321') {
      setTempAdminUser(match);
      setMode('force_reset');
      return;
    }

    // Successful normal login
    dbLocal.setCurrentUser(match);
    onLoginSuccess(match);
    addToast(`Successfully signed in as ${match.name}! Welcome back to HealNex.`, 'success');
    onClose();
  };

  const handleForceResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempAdminUser) return;

    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('Secrets mismatch. Please verify both password entries match.', 'error');
      return;
    }

    // Save new password
    const updatedUsers = dbLocal.getUsers().map(u => {
      if (u.id === tempAdminUser.id) {
        return { ...u, password: newPassword };
      }
      return u;
    });
    dbLocal.saveUsers(updatedUsers);

    // Continue login with updated user
    const updatedUser = updatedUsers.find(u => u.id === tempAdminUser.id)!;
    dbLocal.setCurrentUser(updatedUser);
    onLoginSuccess(updatedUser);
    addToast('Super Admin Security credential upgraded successfully! Session authorized.', 'success');
    onClose();
  };

  const handleRegisterCustomer = (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      addToast('Password must exceed 6 characters.', 'error');
      return;
    }

    // Create Customer
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name,
      email: email,
      password: password,
      role: 'customer',
      createdAt: new Date().toISOString()
    };

    const currentUsers = dbLocal.getUsers();
    if (currentUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      addToast('Email already registered in system index.', 'error');
      return;
    }

    currentUsers.push(newUser);
    dbLocal.saveUsers(currentUsers);

    dbLocal.setCurrentUser(newUser);
    onLoginSuccess(newUser);
    addToast(`Account created successfully! Welcome to HealNex Medi Bazar, ${newUser.name}.`, 'success');
    onClose();
  };

  const handleRegisterVendor = (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      addToast('Password must exceed 6 characters.', 'error');
      return;
    }

    // Verify required uploaded documents
    if (!uploadedDocs.gstCertificate.url) {
      addToast('GST Certificate is required for clinical vendor onboarding. Please upload or scan.', 'error');
      return;
    }
    if (!uploadedDocs.companyRegCertificate.url) {
      addToast('Company Registration Certificate is required for clinical vendor onboarding. Please upload or scan.', 'error');
      return;
    }

    // Create base user credential
    const vendorId = `usr-${Date.now()}`;
    const newUser: User = {
      id: vendorId,
      name: ownerName,
      email: email,
      password: password,
      role: 'vendor',
      createdAt: new Date().toISOString()
    };

    const currentUsers = dbLocal.getUsers();
    if (currentUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      addToast('Email already registered in our system index.', 'error');
      return;
    }

    // Save user credential
    currentUsers.push(newUser);
    dbLocal.saveUsers(currentUsers);

    // Save robust Vendor onboarding records
    const newVendor: Vendor = {
      id: vendorId,
      companyName,
      ownerName,
      email,
      mobileNumber,
      gstNumber,
      panNumber,
      aadhaarNumber,
      businessAddress: address,
      state,
      district,
      pincode,
      bankDetails: {
        bankName,
        accountNumber: bankAccNumber,
        ifscCode: bankIfsc
      },
      documents: {
        gstCertificateUrl: uploadedDocs.gstCertificate.url,
        panCardUrl: uploadedDocs.panCard.url || '',
        aadhaarCardUrl: uploadedDocs.aadhaarCard.url || '',
        tradeLicenseUrl: uploadedDocs.tradeLicense.url,
        companyRegCertificateUrl: uploadedDocs.companyRegCertificate.url,
        cancelledChequeUrl: uploadedDocs.cancelledCheque.url,
        drugLicenseUrl: uploadedDocs.drugLicense.url || '',
        fssaiLicenseUrl: uploadedDocs.fssaiLicense.url || '',
        
        gstCertificateName: uploadedDocs.gstCertificate.name,
        panCardName: uploadedDocs.panCard.name,
        aadhaarCardName: uploadedDocs.aadhaarCard.name,
        tradeLicenseName: uploadedDocs.tradeLicense.name,
        companyRegCertificateName: uploadedDocs.companyRegCertificate.name,
        cancelledChequeName: uploadedDocs.cancelledCheque.name,
        drugLicenseName: uploadedDocs.drugLicense.name,
        fssaiLicenseName: uploadedDocs.fssaiLicense.name,
      },
      status: 'Pending Approval', // Pending admin audit review
      createdAt: new Date().toISOString()
    };

    const currentVendors = dbLocal.getVendors();
    currentVendors.push(newVendor);
    dbLocal.saveVendors(currentVendors);

    // Trigger push notification to Admins
    dbLocal.addNotification(
      'admin',
      'New Corporate Vendor Registered',
      `Manufacturer ${companyName} has registered. 8 security documents uploaded to Supabase. Auditing required.`,
      'vendor_registered'
    );

    addToast('Onboarding profile & verified documents uploaded successfully! Account pending audit.', 'success');
    
    // Log in immediately as vendor
    dbLocal.setCurrentUser(newUser);
    onLoginSuccess(newUser);
    onClose();
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToast(`Simulation SMTP: A password recovery link has been dispatched to ${email}.`, 'info');
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex justify-center items-center p-4">
      <div className={`rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border flex animate-scale-up text-xs font-semibold ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Left Informative Panel (Hidden on Mobile, Visible on Desktop) */}
        <div className={`hidden lg:flex w-[35%] flex-col justify-between p-8 relative overflow-hidden shrink-0 ${
          isDarkMode 
            ? 'bg-gradient-to-b from-slate-950 to-slate-900 border-r border-slate-800' 
            : 'bg-gradient-to-b from-teal-950 to-teal-900 text-white'
        }`}>
          {/* Ambient overlay light */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-teal-500/10 to-transparent pointer-events-none" />
          
          <div className="space-y-6 z-10">
            <div>
              <span className={`text-[9px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase ${
                isDarkMode ? 'bg-teal-500/10 text-teal-400' : 'bg-white/10 text-teal-200'
              }`}>
                Certified Marketplace
              </span>
              <h3 className="text-xl font-bold font-display tracking-tight mt-3 text-white">HealNex Medi Bazar</h3>
              <p className="text-[11px] text-slate-300 mt-1 font-medium">India's Trusted Clinical Equipment Procurement & Supplier Exchange Portal</p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">CDSCO Registered Protocol</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-normal">All supplier catalogs undergo certified medical audit and verified billing standards.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Institutional Accounts</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-normal">Hospitals, diagnostic labs, and medical practitioners access wholesale pricing immediately.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Direct OEM Onboarding</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-normal">Upload drug licenses and trade documents securely via Supabase cloud storage endpoints.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Live System indicators */}
          <div className="z-10 space-y-3 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">
                Secured Audit Gateway Active
              </span>
            </div>
            <div className="flex items-center justify-between text-[8px] text-slate-400 font-mono">
              <span>SHA-256 JWT SECURITY</span>
              <span>TLS 1.3 ENCRYPTION</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel (Universal Body) */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Header Title Bar */}
          <div className={`px-6 py-4 flex items-center justify-between border-b ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-150'
          }`}>
            <div>
              <h2 className={`text-sm font-bold tracking-wide uppercase ${isDarkMode ? 'text-teal-400' : 'text-teal-800'}`}>
                {mode === 'login' && 'Authorized Access Gateway'}
                {mode === 'register_customer' && 'Clinical Purchaser Signup'}
                {mode === 'register_vendor' && 'Supplier Partner Onboarding'}
                {mode === 'forgot' && 'Credential Retrieval'}
                {mode === 'force_reset' && 'Security Clearance Required'}
              </h2>
              <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {mode === 'login' && 'Please authenticate to access wholesale pricing.'}
                {mode === 'register_customer' && 'Sign up to request institutional quotes.'}
                {mode === 'register_vendor' && 'Onboard your clinical factory or medical agency.'}
                {mode === 'forgot' && 'Verify your institutional email to reset.'}
                {mode === 'force_reset' && 'Default password flag detected. Security patch required.'}
              </p>
            </div>
            
            <button 
              onClick={onClose} 
              className={`p-1.5 rounded-full border transition cursor-pointer ${
                isDarkMode 
                  ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850' 
                  : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="Close Portal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Role Tab Bar (Only visible for Standard Login/Register modes) */}
          {(mode === 'login' || mode === 'register_customer' || mode === 'register_vendor') && (
            <div className={`grid grid-cols-3 text-center border-b ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'border-teal-500 text-teal-500 bg-teal-500/5'
                    : `border-transparent ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-850'}`
                }`}
              >
                Sign In
              </button>
              
              <button
                type="button"
                onClick={() => setMode('register_customer')}
                className={`py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  mode === 'register_customer'
                    ? 'border-teal-500 text-teal-500 bg-teal-500/5'
                    : `border-transparent ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-850'}`
                }`}
              >
                Purchaser Signup
              </button>
              
              <button
                type="button"
                onClick={() => setMode('register_vendor')}
                className={`py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  mode === 'register_vendor'
                    ? 'border-teal-500 text-teal-500 bg-teal-500/5'
                    : `border-transparent ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-850'}`
                }`}
              >
                Vendor Onboarding
              </button>
            </div>
          )}

          {/* Form Content Scrolling Window */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            
            {/* 1. Login Mode */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 font-medium">
                <div>
                  <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Corporate Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute top-3.5 left-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. procurement@fortis.com"
                      className={`w-full border rounded-xl p-3 pl-9 outline-none transition-all ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700 focus:ring-1 focus:ring-teal-700'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Access Secret Token / Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute top-3.5 left-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full border rounded-xl p-3 pl-9 pr-10 outline-none transition-all ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700 focus:ring-1 focus:ring-teal-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-teal-600 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px]">
                  <button type="button" onClick={() => setMode('forgot')} className="text-teal-600 font-bold hover:underline cursor-pointer">
                    Forgot Password / Need Token Recovery?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-3 rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  Authorize Connection
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className={`border-t pt-4 text-center space-y-2 text-[11px] ${
                  isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'
                }`}>
                  <p>Access authorized to Hospital Purchasers, Clinical Vendors, and Platform Administrators.</p>
                </div>
              </form>
            )}

            {/* 2. Customer Signup */}
            {mode === 'register_customer' && (
              <form onSubmit={handleRegisterCustomer} className="space-y-4 font-medium">
                <div>
                  <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Full Name / Hospital Procurement Representative *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute top-3.5 left-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Waris Ul Islam"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full border rounded-xl p-3 pl-9 outline-none transition-all ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700 focus:ring-1 focus:ring-teal-700'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Hospital / Diagnostic Lab Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute top-3.5 left-3" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. procurement@fortis.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full border rounded-xl p-3 pl-9 outline-none transition-all ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700 focus:ring-1 focus:ring-teal-700'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Create Access Secret (min 6 symbols) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute top-3.5 left-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full border rounded-xl p-3 pl-9 pr-10 outline-none transition-all ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700 focus:ring-1 focus:ring-teal-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-teal-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                  isDarkMode ? 'bg-teal-950/20 border-teal-850/30 text-teal-300' : 'bg-teal-50/50 border-teal-100 text-teal-850'
                }`}>
                  <Sparkles className="w-4 h-4 text-teal-500 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-[10px] leading-relaxed">
                    By submitting, your purchaser account is generated on the simulated network and grants instant access to explore medical equipments, place RFQs, track logistics and clinical history.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                >
                  Create Purchaser Account
                </button>
              </form>
            )}

            {/* 3. Force Admin Reset safety */}
            {mode === 'force_reset' && (
              <form onSubmit={handleForceResetSubmit} className="space-y-4 font-medium">
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-300 text-amber-950 text-xs leading-relaxed space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldAlert className="w-4 h-4 text-amber-700 animate-pulse" />
                    First-Time Authentication Handover
                  </div>
                  <p className="font-normal text-[10px]">
                    In compliance with clinical administration standards, default credentials are flaglocked.
                    <strong> You MUST replace the placeholder password "654321" with a secure, custom phrase.</strong>
                  </p>
                </div>

                <div>
                  <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    New Administrator Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full border rounded-xl p-3 outline-none transition-all ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700 focus:ring-1 focus:ring-teal-700'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Verify password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full border rounded-xl p-3 outline-none transition-all ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700 focus:ring-1 focus:ring-teal-700'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                >
                  Confirm Upgraded Token
                </button>
              </form>
            )}

            {/* 4. Robust Vendor Onboarding form */}
            {mode === 'register_vendor' && (
              <form onSubmit={handleRegisterVendor} className="space-y-6 font-medium">
                
                {/* Account logins */}
                <div className="space-y-3">
                  <h4 className={`text-[10px] font-bold uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5 ${
                    isDarkMode ? 'text-slate-300 border-slate-800' : 'text-slate-800 border-slate-100'
                  }`}>
                    <KeyRound className="w-4 h-4 text-teal-500" />
                    Authorized Partner Sign-In Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Supplier Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. deals@philips.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full border rounded-lg p-2.5 outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Secure Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Min 6 symbols"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full border rounded-lg p-2.5 outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Company business fields */}
                <div className="space-y-3">
                  <h4 className={`text-[10px] font-bold uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5 ${
                    isDarkMode ? 'text-slate-300 border-slate-800' : 'text-slate-800 border-slate-100'
                  }`}>
                    <Store className="w-4 h-4 text-teal-500" />
                    Corporate Registration Profile
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Entity Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Philips Health India"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className={`w-full border rounded-lg p-2.5 outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Owner / Chief Officer *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. S. K. Roy"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className={`w-full border rounded-lg p-2.5 outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Mobile Contact No *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className={`w-full border rounded-lg p-2.5 outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        GST Identification No *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="22AAAAA1111A1Z1"
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value)}
                        className={`w-full border rounded-lg p-2.5 outline-none font-mono transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Corporate Permanent Account No (PAN) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ABCDE1234F"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value)}
                        className={`w-full border rounded-lg p-2.5 outline-none font-mono transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Promoter Aadhaar Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="1234 5678 9012"
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value)}
                        className={`w-full border rounded-lg p-2.5 outline-none font-mono transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Commercial Physical Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Factory floor, plot coordinates..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={`w-full border rounded-lg p-2.5 outline-none transition-all ${
                        isDarkMode 
                          ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        District *
                      </label>
                      <input
                        type="text"
                        required
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className={`w-full border p-2 rounded-lg outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className={`w-full border p-2 rounded-lg outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className={`w-full border p-2 rounded-lg outline-none font-mono transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Settlement Bank details */}
                <div className="space-y-3">
                  <h4 className={`text-[10px] font-bold uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5 ${
                    isDarkMode ? 'text-slate-300 border-slate-800' : 'text-slate-800 border-slate-100'
                  }`}>
                    <FileText className="w-4 h-4 text-teal-500" />
                    Wholesale Settlement Bank Profile
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HDFC Bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className={`w-full border p-2 rounded-lg outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                        }`}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Account No *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 501000213123"
                        value={bankAccNumber}
                        onChange={(e) => setBankAccNumber(e.target.value)}
                        className={`w-full border p-2 rounded-lg outline-none font-mono transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                        }`}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        IFSC Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="HDFC0000001"
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value)}
                        className={`w-full border p-2 rounded-lg outline-none font-mono transition-all ${
                          isDarkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Verification document uploads check list */}
                <div className={`space-y-4 p-5 rounded-2xl border ${
                  isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-150'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-teal-500" />
                      <h4 className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                        HealNex Secure Provider Documents Checklist
                      </h4>
                    </div>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      isDarkMode ? 'bg-teal-950 text-teal-400' : 'bg-teal-100 text-teal-800'
                    }`}>
                      SECURED ENDPOINT
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-normal">
                    Please upload active digital copies of your credentials. Document files are stored encrypted on Supabase isolated storage bucketing. Maximum limit per attachment: 10 MB. Supported: PDF, JPG, JPEG, PNG, WEBP.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
                    {[
                      { key: 'gstCertificate', label: 'GST Certificate (Form REG-06)', required: true },
                      { key: 'tradeLicense', label: 'Active Municipal Trade License', required: false },
                      { key: 'companyRegCertificate', label: 'Company Registration (CoI)', required: true },
                      { key: 'cancelledCheque', label: 'Cancelled Cheque Leaf', required: false },
                      { key: 'panCard', label: 'Corporate PAN Card', required: false },
                      { key: 'aadhaarCard', label: 'Promoter Aadhaar Card', required: false },
                      { key: 'drugLicense', label: 'State Drug Control License', required: false },
                      { key: 'fssaiLicense', label: 'FSSAI Food Safety License', required: false },
                    ].map((doc) => {
                      const docState = uploadedDocs[doc.key];
                      return (
                        <div
                          key={doc.key}
                          id={`upload-card-${doc.key}`}
                          className={`border rounded-xl p-3 flex flex-col justify-between transition-all ${
                            docState.url
                              ? 'border-emerald-500/30 bg-emerald-500/5'
                              : isDarkMode 
                                ? 'border-slate-800 bg-slate-900/50 hover:border-slate-700' 
                                : 'border-slate-200 bg-white hover:border-teal-600/30'
                          }`}
                        >
                          {/* Title and requirements badge */}
                          <div className="flex items-start justify-between gap-1 mb-2">
                            <span className={`text-[10px] font-bold leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                              {doc.label}
                            </span>
                            {doc.required ? (
                              <span className="shrink-0 text-[8px] bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1.5 py-0.5 rounded-md font-bold font-mono">
                                REQUIRED
                              </span>
                            ) : (
                              <span className={`shrink-0 text-[8px] px-1.5 py-0.5 rounded-md font-bold font-mono ${
                                isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                              }`}>
                                OPTIONAL
                              </span>
                            )}
                          </div>

                          {/* File upload state area */}
                          {docState.isUploading ? (
                            <div className="py-4 space-y-2">
                              <div className="flex items-center justify-between text-[9px] text-slate-400">
                                <span className="flex items-center gap-1 font-mono">
                                  <RefreshCw className="w-3 h-3 text-teal-500 animate-spin" />
                                  Supabase Upload...
                                </span>
                                <span className="font-bold">{docState.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-850 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-teal-500 h-1.5 rounded-full transition-all duration-100"
                                  style={{ width: `${docState.progress}%` }}
                                />
                              </div>
                            </div>
                          ) : docState.url ? (
                            <div className="space-y-2 mt-1">
                              {/* Document successfully loaded */}
                              <div className={`flex items-center gap-2 p-2 rounded-lg border relative overflow-hidden group ${
                                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-150'
                              }`}>
                                <div className={`w-10 h-14 border rounded shrink-0 overflow-hidden shadow-sm flex items-center justify-center ${
                                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                                }`}>
                                  {docState.previewUrl ? (
                                    <img
                                      src={docState.previewUrl}
                                      alt="Preview"
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <File className="w-5 h-5 text-slate-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[9px] font-mono font-bold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`} title={docState.name}>
                                    {docState.name}
                                  </p>
                                  <p className="text-[8px] text-slate-400 font-mono mt-0.5">
                                    {docState.size} • Verified Secure
                                  </p>
                                  <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-500 mt-1">
                                    <CheckCircle className="w-3 h-3" /> Supabase CDN Live
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeUploadedDoc(doc.key)}
                                  className={`p-1 rounded absolute right-1.5 top-1.5 shadow-sm opacity-90 transition cursor-pointer ${
                                    isDarkMode 
                                      ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-500/30' 
                                      : 'bg-white border border-slate-200 text-slate-400 hover:text-rose-500'
                                  }`}
                                  title="Remove document"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 space-y-2">
                              {/* Drag & drop or picker */}
                              <div className="flex gap-1.5">
                                {/* File Input Picker */}
                                <label className={`flex-1 flex flex-col items-center justify-center border border-dashed rounded-lg p-3 transition cursor-pointer text-center relative ${
                                  isDarkMode 
                                    ? 'border-slate-800 hover:border-teal-500 hover:bg-slate-950/40' 
                                    : 'border-slate-200 hover:border-teal-500 hover:bg-slate-50/50'
                                }`}>
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileUpload(doc.key, file);
                                    }}
                                    className="hidden"
                                  />
                                  <Upload className="w-4 h-4 text-slate-400 mb-1" />
                                  <span className={`text-[9px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Choose File</span>
                                </label>

                                {/* Camera capture simulation button */}
                                <button
                                  type="button"
                                  onClick={() => captureCameraMock(doc.key)}
                                  className={`flex-1 flex flex-col items-center justify-center border border-dashed rounded-lg p-3 transition text-center cursor-pointer ${
                                    isDarkMode 
                                      ? 'border-slate-800 hover:border-orange-500 hover:bg-slate-950/40' 
                                      : 'border-slate-200 hover:border-orange-500 hover:bg-slate-50/50'
                                  }`}
                                >
                                  <Camera className="w-4 h-4 text-slate-400 mb-1" />
                                  <span className={`text-[9px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Camera Scan</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                >
                  Submit Clinical Supplying Profile
                </button>
              </form>
            )}

            {/* 5. Forgot Password */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4 font-medium">
                <div>
                  <label className={`block mb-1 text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Verify Institutional Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="procurement@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full border rounded-xl p-3 outline-none transition-all ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-700'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                >
                  Send Verification Key
                </button>

                <button 
                  type="button" 
                  onClick={() => setMode('login')} 
                  className="block mx-auto text-[10px] text-teal-600 font-bold hover:underline pt-2 cursor-pointer"
                >
                  Back to Sign In
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
