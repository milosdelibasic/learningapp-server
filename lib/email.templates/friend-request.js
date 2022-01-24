exports.friendRequest = ({redirectUrl, email}) => {
  return template = `
    <a href="${redirectUrl}" target="_blank">
      <div style="text-decoration:none;display:inline-block;color:#ffffff;background-color:#00c84a;border-radius:60px;-webkit-border-radius:60px;-moz-border-radius:60px;width:auto; width:auto;;border-top:1px solid #00c84a;border-right:1px solid #00c84a;border-bottom:1px solid #00c84a;border-left:1px solid #00c84a;padding-top:15px;padding-bottom:15px;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;text-align:center;mso-border-alt:none;word-break:keep-all;"><span style="padding-left:30px;padding-right:30px;font-size:16px;display:inline-block;"><span style="font-size: 16px; margin: 0; line-height: 2; word-break: break-word; mso-line-height-alt: 32px;">
        <strong>Click here to accept the invite</strong></span></span>
      </div>
    </a>
  `
}

