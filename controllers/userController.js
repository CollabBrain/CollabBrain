const { User } = require('../models');
const bcrypt = require('bcryptjs');

// Helper function to validate email
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin' });

    let user = await User.findOne({ where: { email } });
    if (user) return res.status(400).json({ message: 'Email đã tồn tại' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    res.status(201).json({ message: 'Đăng ký thành công', userId: user.id });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ message: 'Đăng nhập thành công', token });
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, email, phone, bio, password, avatar } = req.body;

    // 1. Validate Input Basics
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    if (phone && phone.length < 10) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }

    // 2. Find user in Database
    let user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // 3. Security Check - Check if email is being changed and is already taken
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
    }

    // 4. Update fields
    if (fullName) user.fullName = fullName.trim();
    if (email) user.email = email.trim();
    if (phone) user.phone = phone.trim();
    if (bio) user.bio = bio.trim();
    if (avatar) user.avatar = avatar.trim();

    // 5. Security - Hash password if it's being updated
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Save changes
    await user.save();

    // Don't send password back in response
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      bio: user.bio,
      avatar: user.avatar,
      updatedAt: user.updatedAt
    };

    res.json({
      message: 'Cập nhật hồ sơ thành công',
      user: userResponse
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật profile:', error.message);
    res.status(500).send('Lỗi máy chủ nội bộ');
  }
};

module.exports = {
  register,
  login,
  updateProfile
};
