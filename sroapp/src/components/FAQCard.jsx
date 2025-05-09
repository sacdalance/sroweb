import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const FAQCard = () => {
  const faqs = [
    {
      question: "How do I submit an activity request?",
      answer: "Navigate to the 'Submit an Activity' section and fill out the required form.",
    },
    {
      question: "Can I request a change in schedule or venue after approval?",
      answer: "Yes. You can submit a request to change the schedule or venue, which will require re-approval by the SRO and ODSA.",
    },
    {
      question: "What happens after I submit my activity request?",
      answer: "The SRO and ODA will review it. Once reviewed, the SRO will approve and the ODSA will provide the final confirmation.",
    },
    {
      question: "What forms do I need to submit for the annual report?",
      answer: "You need the Report on Past Activities (Form D) and the Financial Report (Form F), both available within the app.",
    },
    {
      question: "What are the requirements for organization recognition?",
      answer: "You need to submit several forms, such as officer/member rosters and proposed activities. These are provided in the Aplication for Recognition section.",
    },
    {
      question: "How do I book an interview for recognition?",
      answer: "After submitting your recognition forms, the system will prompt you to book an interview with the SRO.",
    },
  ];

  return (
    <Card className="shadow-sm rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-[#7B1113]">Frequently Asked Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionTrigger className="text-sm font-medium text-[#7B1113]">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default FAQCard;