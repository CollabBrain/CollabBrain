import { Request, Response } from "express";
import { editProfileService, forgotPasswordServiceSendMail, loginService, refreshTokenService, registerService, resetPasswordService, updateStatusService, verifyOTPForgotPassword, verifyOTPRegister } from "../../services/client/user.service";
import { cookieConfig } from "../../config/cookie";
import prisma from "../../config/prisma";

//[POSt] /user/login
export const loginPost = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginService({ email, password })
    res.cookie("refreshToken", result.refreshToken, {
      ...cookieConfig,
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.cookie("accessToken", result.accessToken, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000  // 15 minutes
    })
    res.status(200).json({
      code: 200,
      data: result
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message
    })
  }
}



//[POST] /user/register - gửi email otp
export const registerPost = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const result = await registerService({ email, password, name })

    res.status(200).json({
      code: 200,
      data: result
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message
    })
  }
}

// [POST] /user/register/verify-otp  — xác nhận OTP, tạo user
export const verifyOtpRegisterPost = async (req: Request, res: Response) => {
  try {
    const { email, otp, password, name } = req.body;

    const result = await verifyOTPRegister({ email, otp, password, name });
    res.cookie("refreshToken", result.refreshToken, {
      ...cookieConfig,
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.cookie("accessToken", result.accessToken, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000  // 15 minutes
    })
    res.status(200).json({ code: 200, data: result });
  } catch (error: any) {
    res.status(400).json({ code: 400, message: error.message });
  }
};


//[POST] /user/forgot-pasword/forgot
export const forgotPasswordPost = async (req: Request, res: Response) => {
  try {
    const email = req.body.email

    const result = await forgotPasswordServiceSendMail(email)

    res.status(200).json({
      code: 200,
      data: result
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message
    })
  }
}

//[POST] /user/forgot-password/otp
export const verifyOTPPost = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const result = await verifyOTPForgotPassword(email, otp)

    res.status(200).json({
      code: 200,
      data: result
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message
    })
  }
}

//[POST] /user/forgot-password/rest
export const resetPasswordPost = async (req: Request, res: Response) => {
  try {
    const { email, otp, password } = req.body

    const result = await resetPasswordService({ email, otp, password })

    res.cookie("refreshToken", result.refreshToken, {
      ...cookieConfig,
      maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.cookie("accessToken", result.accessToken, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000  // 15 minutes
    })

    res.status(200).json({
      code: 200,
      data: result
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message
    })
  }
}
export const userProfile = (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    // ẩn status nếu đã hết hạn
    const now = new Date();
    const effectiveStatus = user.statusExpiresAt && new Date(user.statusExpiresAt) > now
      ? user.status
      : null;
    res.status(200).json({
      data: { ...user, status: effectiveStatus },
      message: "Lấy thông tin profile thành công",
      code: 200
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message
    })
  }
}

export const editProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const result = await editProfileService(user.id, req.body)
    res.status(200).json({
      code: 200,
      data: result,
      message: "Cập nhật profile thành công"
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message
    });
  }
}

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status } = req.body;
    if (status !== undefined && status !== null && typeof status === 'string' && status.trim().length > 80) {
      return res.status(400).json({ code: 400, message: 'Status không được vượt quá 80 ký tự' });
    }
    const result = await updateStatusService(user.id, status ?? null);
    res.status(200).json({
      code: 200,
      data: result,
      message: 'Cập nhật trạng thái thành công'
    });
  } catch (error: any) {
    res.status(400).json({ code: 400, message: error.message });
  }
};


export const refreshTokenPost = async (req: Request, res: Response) => {

  try {
    // Accept refreshToken from body (frontend) or cookie (other clients)
    const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        code: 401,
        message: "Không tìm thấy refresh token"
      })
    }
    const result = await refreshTokenService(refreshToken)
    res.cookie("accessToken", result.accessToken, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000  // 15 minutes
    })
    res.status(200).json({
      code: 200,
      data: result,
      message: "Refresh token thành công"
    })
  } catch (error: any) {
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    return res.status(400).json({
      code: 400,
      message: error.message || "Phiên đăng nhập hết hạn"
    })
  }
}


//[POST] /user/logout
export const logoutPost = async (req: Request, res: Response)=>{
  try {
    res.clearCookie('accessToken', cookieConfig);
    
    res.clearCookie('refreshToken', cookieConfig);
    res.status(200).json({
      code: 200,
      message: "Đăng xuất thành công"
    })
  } catch (error) {
    res.status(400).json({
      code: 400,
      message: "Đăng xuất thất bại"
    })
  }
}

//[GET] /user/profile/:id — Xem profile người khác
export const userProfileById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findFirst({
      where: { id, isDeleted: false, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy người dùng",
      });
    }

    const currentUser = (req as any).user;
    let friendshipStatus: string | null = null;
    let isSender = false;

    if (currentUser && currentUser.id !== user.id) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { senderId: currentUser.id, receiverId: user.id },
            { senderId: user.id, receiverId: currentUser.id },
          ],
        },
      });

      if (friendship) {
        friendshipStatus = friendship.status;
        isSender = friendship.senderId === currentUser.id;
      }
    }

    res.status(200).json({
      code: 200,
      data: {
        ...user,
        friendshipStatus,
        isSender,
      },
      message: "Lấy thông tin profile thành công",
    });
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      message: error.message,
    });
  }
};
