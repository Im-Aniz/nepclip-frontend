import InquiryForm from "../../components/InquiryForm";

export default function Contact() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-4xl font-extrabold">Talk to our team</h1>
      <p className="mb-6 mt-2 text-mute">Campaign question, partnership, or something else? Leave your details and we'll get back within one working day.</p>
      <InquiryForm />
    </div>
  );
}
