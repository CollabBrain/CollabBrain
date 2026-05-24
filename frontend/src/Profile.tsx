import { useState } from "react"
import { Button } from "./components/ui/Button"
import { Input } from "./components/ui/Input"
import { Label } from "./components/ui/Label"
import { Avatar } from "./components/ui/Avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/Card"
import { Camera, Mail, MapPin, Phone, Briefcase, Shield, Edit2 } from "lucide-react"

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false)
  
  const [user, setUser] = useState({
    name: "Nguyễn Văn A",
    role: "Senior Software Engineer",
    email: "nguyenvana@example.com",
    phone: "+84 987 654 321",
    location: "Hồ Chí Minh, Việt Nam",
    bio: "Đam mê lập trình và xây dựng các hệ thống scalable. Thích tham gia các cuộc họp từ xa hiệu quả.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  })

  const handleSave = () => {
    setIsEditing(false)
    // Here you would typically save the data to your API
  }

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-5xl w-full space-y-8">
        
        {/* Profile Card */}
        <Card className="overflow-hidden border-0 shadow-lg">
          {/* Cover Photo */}
          <div className="h-56 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
            <Button 
              variant="secondary" 
              size="sm" 
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white border-0 backdrop-blur-md"
            >
              <Camera className="w-4 h-4 mr-2" /> Thay đổi ảnh bìa
            </Button>
          </div>

          <CardContent className="relative px-8 pb-8">
            {/* Avatar */}
            <div className="absolute -top-20 left-8 flex items-end">
              <div className="relative group cursor-pointer">
                <Avatar 
                  src={user.avatar} 
                  fallback="NA" 
                  className="w-40 h-40 border-[6px] border-white shadow-xl bg-white"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity m-[6px]">
                  <Camera className="text-white w-10 h-10" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4 pb-2 h-16">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 shadow-md transition-transform hover:-translate-y-0.5">
                  <Edit2 className="w-4 h-4" /> Chỉnh sửa Profile
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" className="rounded-full px-6" onClick={() => setIsEditing(false)}>Hủy</Button>
                  <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 shadow-md transition-transform hover:-translate-y-0.5">Lưu thay đổi</Button>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="mt-8">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{user.name}</h1>
              <p className="text-xl text-indigo-600 font-semibold mt-2 flex items-center gap-2">
                <Briefcase className="w-5 h-5" /> {user.role}
              </p>
              <p className="text-slate-600 mt-4 max-w-3xl text-lg leading-relaxed">
                {user.bio}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Contact Info */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                  <Phone className="w-5 h-5 text-indigo-500" /> Liên hệ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-50 p-2 rounded-full">
                    <Mail className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Email</p>
                    <p className="text-sm text-slate-500 mt-1">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-pink-50 p-2 rounded-full">
                    <Phone className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Số điện thoại</p>
                    <p className="text-sm text-slate-500 mt-1">{user.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-purple-50 p-2 rounded-full">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Địa chỉ</p>
                    <p className="text-sm text-slate-500 mt-1">{user.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                  <Shield className="w-5 h-5 text-indigo-500" /> Bảo mật
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                 <Button variant="outline" className="w-full justify-start text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-indigo-600">
                    Đổi mật khẩu
                 </Button>
                 <Button variant="outline" className="w-full justify-start text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-indigo-600">
                    Cài đặt xác thực 2 bước
                 </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Forms / Content */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-md h-full">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-xl text-slate-800">Thông tin cá nhân</CardTitle>
                <CardDescription className="text-base">
                  Cập nhật thông tin chi tiết của bạn tại đây.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-600">Họ và tên</Label>
                      <Input 
                        id="name" 
                        value={user.name} 
                        readOnly={!isEditing}
                        onChange={(e) => setUser({...user, name: e.target.value})}
                        className={`text-base ${!isEditing ? "bg-slate-50 border-transparent shadow-none" : "border-slate-300"}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-slate-600">Chức vụ</Label>
                      <Input 
                        id="role" 
                        value={user.role} 
                        readOnly={!isEditing}
                        onChange={(e) => setUser({...user, role: e.target.value})}
                        className={`text-base ${!isEditing ? "bg-slate-50 border-transparent shadow-none" : "border-slate-300"}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-600">Địa chỉ Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={user.email} 
                        readOnly={!isEditing}
                        onChange={(e) => setUser({...user, email: e.target.value})}
                        className={`text-base ${!isEditing ? "bg-slate-50 border-transparent shadow-none" : "border-slate-300"}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-600">Số điện thoại</Label>
                      <Input 
                        id="phone" 
                        value={user.phone} 
                        readOnly={!isEditing}
                        onChange={(e) => setUser({...user, phone: e.target.value})}
                        className={`text-base ${!isEditing ? "bg-slate-50 border-transparent shadow-none" : "border-slate-300"}`}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="location" className="text-slate-600">Địa chỉ</Label>
                      <Input 
                        id="location" 
                        value={user.location} 
                        readOnly={!isEditing}
                        onChange={(e) => setUser({...user, location: e.target.value})}
                        className={`text-base ${!isEditing ? "bg-slate-50 border-transparent shadow-none" : "border-slate-300"}`}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-slate-600">Giới thiệu ngắn (Bio)</Label>
                    <textarea 
                      id="bio"
                      value={user.bio}
                      readOnly={!isEditing}
                      onChange={(e) => setUser({...user, bio: e.target.value})}
                      className={`flex min-h-[120px] w-full rounded-md border border-input px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${!isEditing ? "bg-slate-50 border-transparent shadow-none resize-none" : "bg-background border-slate-300 shadow-sm resize-y"}`}
                    />
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}
