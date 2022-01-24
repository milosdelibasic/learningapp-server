exports.reuploadFilesTemplate = (subject, message,name) => {
  return template = `
      <div>
      <div>
      <div><h2>${subject}</h2></div>
      <h1 style="color:#00c84a;">Hello ${name},</h1></div>
        <div><h4> ${message}</h4></div>
      </div>
  `
}