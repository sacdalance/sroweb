import { sendEmailAPI } from "@/api/emailServicesAPI";

function EmailTestButton() {
  const handleSend = async () => {
    const response = await sendEmailAPI({
      to: "snoopgromp@gmail.com", // Replace with a real email for testing
      subject: "Test Email from SRO App",
      text: "Plain text fallback",
      html: "<h1>Hello from SRO Web App</h1><p>This is a test email</p>",
    });

    if (response.success) {
      alert("Email sent successfully! Message ID: " + response.messageId);
    } else {
      alert("Failed to send email: " + response.error);
    }
  };

  return (
    <button
      onClick={handleSend}
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
    >
      Send Test Email
    </button>
  );
}

export default EmailTestButton;