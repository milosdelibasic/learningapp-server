exports.forgotPasswordTemplate = (redirectUrl) => {
  return template = `
    <a href="${redirectUrl}" target="_blank">
      <div style="text-decoration:none;display:inline-block;color:#ffffff;background-color:#550798;border-radius:60px;-webkit-border-radius:60px;-moz-border-radius:60px;width:auto; width:auto;;border-top:1px solid #ac4efe;border-right:1px solid #ac4efe;border-bottom:1px solid #ac4efe;border-left:1px solid #ac4efe;padding-top:15px;padding-bottom:15px;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;text-align:center;mso-border-alt:none;word-break:keep-all;"><span style="padding-left:30px;padding-right:30px;font-size:16px;display:inline-block;"><span style="font-size: 16px; margin: 0; line-height: 2; word-break: break-word; mso-line-height-alt: 32px;">
        <strong>Click Here</strong></span></span>
      </div>
    </a>
  `
}

