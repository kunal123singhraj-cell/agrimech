import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, UserRole } from '../models/User';
import { OtpModel } from '../models/Otp';
import { SmsService } from '../services/smsService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, role, organization, registrationId, district, state, password } = req.body;

    if (!email || !password || !name || !role) {
      res.status(400).json({ success: false, message: 'Missing required registration details.' });
      return;
    }

    // Check if user already exists
    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      name,
      email: email.toLowerCase(),
      phone,
      role: role as UserRole,
      organization: organization || (role === 'farmer' ? `${name}'s Farm Hub` : `${name}'s Industrial Plant`),
      registrationId: registrationId || `REG-${Date.now().toString().slice(-6)}`,
      district: district || 'Local District',
      state: state || 'Local State',
      password: hashedPassword
    });

    const secret = process.env.JWT_SECRET || 'agrimech_secret_jwt_key_2026_dev';
    const token = jwt.sign(
      {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        organization: newUser.organization,
        registrationId: newUser.registrationId,
        district: newUser.district,
        state: newUser.state
      },
      message: 'Account registered and securely authenticated.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { loginId, password } = req.body;
    const queryId = (loginId || '').trim();

    if (!queryId) {
      res.status(400).json({ success: false, message: 'Please provide phone number or email.' });
      return;
    }

    let user = null;

    try {
      // Find in real MongoDB by email, phone, or registration ID
      user = await UserModel.findOne({
        $or: [
          { email: queryId.toLowerCase() },
          { phone: queryId },
          { phone: `+91 ${queryId.slice(0, 5)} ${queryId.slice(5)}` },
          { registrationId: queryId }
        ]
      });
    } catch {
      user = null;
    }

    // Reject unknown users (Zero Fake Data Policy)
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'No account found with these credentials. Please log in via mobile OTP or register your account.'
      });
      return;
    }

    // If user exists in MongoDB, verify real password
    if (user.password && password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
        return;
      }
    }

    const secret = process.env.JWT_SECRET || 'agrimech_secret_jwt_key_2026_dev';
    const userId = user._id.toString();

    const token = jwt.sign(
      {
        id: userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organization: user.organization,
        registrationId: user.registrationId,
        district: user.district,
        state: user.state
      },
      message: `Authenticated successfully as ${user.role === 'farmer' ? 'Residue Seller' : 'Industrial Buyer'}`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.id) {
      const user = await UserModel.findById(req.user.id);
      if (user) {
        res.json({
          success: true,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            organization: user.organization,
            registrationId: user.registrationId,
            district: user.district,
            state: user.state
          }
        });
        return;
      }
    }

    res.status(401).json({ success: false, message: 'User not authenticated.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const switchRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Authentication required to switch role.' });
      return;
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found in database.' });
      return;
    }

    user.role = user.role === 'farmer' ? 'buyer' : 'farmer';
    await user.save();

    const secret = process.env.JWT_SECRET || 'agrimech_secret_jwt_key_2026_dev';
    const token = jwt.sign(
      {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organization: user.organization,
        registrationId: user.registrationId,
        district: user.district,
        state: user.state
      },
      message: `Switched workspace role to ${user.role}`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Dispatch real 6-digit OTP to mobile phone
 * POST /api/auth/send-otp
 */
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawDigits = (req.body.phone || '').replace(/\D/g, '').slice(-10);

    if (rawDigits.length !== 10 || !/^[6-9]\d{9}$/.test(rawDigits)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number.'
      });
      return;
    }

    // Generate secure 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Invalidate any previous unverified OTPs for this number
    await OtpModel.deleteMany({ phone: rawDigits });

    // Store new active OTP in MongoDB
    await OtpModel.create({
      phone: rawDigits,
      otp,
      expiresAt,
      verified: false
    });

    // Send real SMS through Fast2SMS, Twilio, or formatted dev console
    const smsResult = await SmsService.sendOtp(rawDigits, otp);

    const isDev = process.env.NODE_ENV !== 'production' || smsResult.provider === 'dev_console';

    res.json({
      success: true,
      message: `6-digit verification code sent to +91 ${rawDigits}.`,
      phone: rawDigits,
      expiresInSeconds: 300,
      provider: smsResult.provider,
      devOtp: isDev ? otp : undefined
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verify OTP entered by user
 * POST /api/auth/verify-otp
 */
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawDigits = (req.body.phone || '').replace(/\D/g, '').slice(-10);
    const code = (req.body.otp || '').toString().trim();

    if (!rawDigits || rawDigits.length !== 10) {
      res.status(400).json({ success: false, message: 'Valid 10-digit phone number is required.' });
      return;
    }

    if (!code || code.length !== 6) {
      res.status(400).json({ success: false, message: 'Please enter the 6-digit OTP.' });
      return;
    }

    // Find active OTP record
    const otpRecord = await OtpModel.findOne({
      phone: rawDigits,
      otp: code,
      expiresAt: { $gt: new Date() },
      verified: false
    });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code. Please enter the correct code or request a new OTP.'
      });
      return;
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Check if user already exists in database
    const formattedPhone = `+91 ${rawDigits.slice(0, 5)} ${rawDigits.slice(5)}`;
    const existingUser = await UserModel.findOne({
      $or: [
        { phone: rawDigits },
        { phone: `+91${rawDigits}` },
        { phone: formattedPhone },
        { phone: new RegExp(rawDigits + '$') }
      ]
    });

    if (existingUser) {
      const secret = process.env.JWT_SECRET || 'agrimech_secret_jwt_key_2026_dev';
      const token = jwt.sign(
        {
          id: existingUser._id.toString(),
          name: existingUser.name,
          phone: existingUser.phone,
          role: existingUser.role
        },
        secret,
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        isNewUser: false,
        token,
        user: {
          id: existingUser._id.toString(),
          name: existingUser.name,
          email: existingUser.email,
          phone: existingUser.phone,
          role: existingUser.role,
          organization: existingUser.organization,
          registrationId: existingUser.registrationId,
          district: existingUser.district,
          state: existingUser.state
        },
        message: `Welcome back, ${existingUser.name}! Real account logged in.`
      });
      return;
    }

    // If new user, inform frontend to prompt for user profile details
    res.json({
      success: true,
      isNewUser: true,
      phone: rawDigits,
      message: 'Mobile number verified successfully! Please complete your profile.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Complete real registration for new user after phone OTP verification
 * POST /api/auth/complete-registration
 */
export const completeRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawDigits = (req.body.phone || '').replace(/\D/g, '').slice(-10);
    const {
      name,
      role,
      organization,
      district,
      state,
      companyName,
      gstin,
      transportLicense,
      preferredLanguage,
      chatLanguage
    } = req.body;

    const validRoles: UserRole[] = ['farmer', 'buyer', 'transporter', 'admin'];
    const userRole = (validRoles.includes(role) ? role : 'farmer') as UserRole;

    // Verify that OTP was verified in the last 15 minutes
    const verifiedOtp = await OtpModel.findOne({
      phone: rawDigits,
      verified: true,
      updatedAt: { $gt: new Date(Date.now() - 15 * 60 * 1000) }
    });

    if (!verifiedOtp) {
      res.status(400).json({
        success: false,
        message: 'Phone verification expired or not found. Please request a new OTP code.'
      });
      return;
    }

    const formattedPhone = `+91 ${rawDigits.slice(0, 5)} ${rawDigits.slice(5)}`;
    const regPrefixMap: Record<UserRole, string> = {
      farmer: 'FARM-REG-',
      buyer: 'BUYER-REG-',
      transporter: '3PL-REG-',
      admin: 'ADMIN-REG-'
    };
    const registrationId = `${regPrefixMap[userRole]}${Date.now().toString().slice(-6)}`;

    // Create real user in MongoDB
    const newUser = await UserModel.create({
      name: name.trim(),
      phone: formattedPhone,
      role: userRole,
      organization:
        (organization && organization.trim()) ||
        (userRole === 'farmer'
          ? `${name.trim()}'s Agri Farm`
          : userRole === 'transporter'
          ? `${companyName || name.trim()} Logistics Ltd.`
          : userRole === 'admin'
          ? 'AgriMech Platform Operations'
          : `${name.trim()}'s Procurement Mill`),
      registrationId,
      district: (district && district.trim()) || 'Ramanagara / Bengaluru South',
      state: (state && state.trim()) || 'Karnataka',
      companyName: companyName || organization,
      gstin,
      transportLicense,
      approvalStatus: userRole === 'transporter' ? 'approved' : 'approved',
      preferredLanguage: preferredLanguage || 'en',
      chatLanguage: chatLanguage || 'en'
    });

    const secret = process.env.JWT_SECRET || 'agrimech_secret_jwt_key_2026_dev';
    const token = jwt.sign(
      {
        id: newUser._id.toString(),
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role
      },
      secret,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        organization: newUser.organization,
        registrationId: newUser.registrationId,
        district: newUser.district,
        state: newUser.state,
        companyName: newUser.companyName,
        gstin: newUser.gstin,
        transportLicense: newUser.transportLicense,
        approvalStatus: newUser.approvalStatus,
        preferredLanguage: newUser.preferredLanguage,
        chatLanguage: newUser.chatLanguage
      },
      message: `Account created successfully! Welcome to AgriMech, ${newUser.name}.`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLanguage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { preferredLanguage, chatLanguage } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...(preferredLanguage && { preferredLanguage }),
          ...(chatLanguage && { chatLanguage })
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        preferredLanguage: updated?.preferredLanguage || 'en',
        chatLanguage: updated?.chatLanguage || 'en'
      },
      message: 'Language preferences saved to profile.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

