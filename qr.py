import qrcode
img = qrcode.make("https://resume.heigen.io/")
img.save("resume_qr.png")
