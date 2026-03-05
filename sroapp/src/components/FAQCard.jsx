import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { HelpCircle, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How do I submit an activity request?",
    answer: "Navigate to the 'New Activity Request' section in the sidebar and fill out the required form.",
  },
  {
    question: "Can I request a change after approval?",
    answer: "Yes. You can submit a request to change the schedule or venue, which will require re-approval by the SRO and ODSA.",
  },
  {
    question: "What happens after I submit my request?",
    answer: "The SRO and ODSA will review it. Once reviewed, the SRO will approve and the ODSA will provide the final confirmation.",
  },
  {
    question: "What forms do I need for the annual report?",
    answer: "You need the Report on Past Activities (Form D) and the Financial Report (Form F), both available within the app.",
  },
  {
    question: "What are the requirements for org recognition?",
    answer: "You need to submit several forms, such as officer/member rosters and proposed activities. These are provided in the Application for Recognition section.",
  },
  {
    question: "How do I book an interview for recognition?",
    answer: "After submitting your recognition forms, the system will prompt you to book an interview with the SRO.",
  },
];

const FAQCard = ({ className }) => {
  const [showAll, setShowAll] = useState(false);
  const previewFaqs = faqs.slice(0, 3);

  return (
    <>
      <Card className={cn("shadow-sm", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-sro-primary flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Help Center
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-sro-primary hover:text-sro-primary-800"
              onClick={() => setShowAll(true)}
            >
              See all <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {previewFaqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm font-medium text-gray-700 hover:text-sro-primary py-3">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-500 pb-3">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sro-primary flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Frequently Asked Questions
            </DialogTitle>
            <DialogDescription>
              Find answers to common questions about using the SRO portal.
            </DialogDescription>
          </DialogHeader>
          <Accordion type="single" collapsible className="space-y-2 mt-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-full-${index}`} className="border rounded-lg px-3">
                <AccordionTrigger className="text-sm font-medium text-gray-700 hover:text-sro-primary py-3">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-500 pb-3">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FAQCard;
