import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { HelpCircle, ArrowRight, FileText, Upload, UserCheck, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const approvalSteps = [
  { icon: FileText, label: "Fill Out Form", desc: "Go to New Activity Request and complete the form with your activity details." },
  { icon: Upload, label: "Upload Documents", desc: "Attach your Concept Paper (and Form 2B if off-campus)." },
  { icon: UserCheck, label: "Adviser Review", desc: "Your organization adviser endorses or rejects the request." },
  { icon: ShieldCheck, label: "SRO Review", desc: "The Student Relations Office reviews and approves." },
  { icon: CheckCircle2, label: "ODSA Approval", desc: "The ODSA gives the final approval." },
];

const faqs = [
  {
    question: "Can I edit or cancel a submitted request?",
    answer: "Yes. If your request hasn't been fully approved yet, you can submit an appeal to edit details or request cancellation from My Requests.",
  },
  {
    question: "What documents do I need to upload?",
    answer: "For most activities, you need a Concept Paper (PDF). If your activity is off-campus, you also need to upload a notarized Form 2B (Waiver). Mass orientations don't require a concept paper.",
  },
  {
    question: "What happens if my request is rejected?",
    answer: "You'll receive an email notification with the reason. You can revise your request and resubmit it as a new activity request.",
  },
  {
    question: "What forms do I need for the annual report?",
    answer: "You need the Report on Past Activities (Form D) and the Financial Report (Form F), both available within the app.",
  },
  {
    question: "What are the requirements for org recognition?",
    answer: "You need to submit officer/member rosters, proposed activities, and other forms. These are provided in the Recognition Application section.",
  },
  {
    question: "How do I book an interview for recognition?",
    answer: "After submitting your recognition application, the system will prompt you to book an interview slot with the SRO.",
  },
];

const StepByStepGuide = () => (
  <div className="space-y-3">
    {approvalSteps.map((step, i) => (
      <div key={i} className="flex items-start gap-3">
        <div className="shrink-0 flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-sro-secondary/10 flex items-center justify-center">
            <step.icon className="w-4 h-4 text-sro-secondary" />
          </div>
          {i < approvalSteps.length - 1 && (
            <div className="w-px h-4 bg-gray-200 mt-1" />
          )}
        </div>
        <div className="pt-1">
          <p className="text-sm font-medium text-gray-800 leading-tight">{step.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
        </div>
      </div>
    ))}
  </div>
);

const FAQCard = ({ className }) => {
  const [showAll, setShowAll] = useState(false);

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
        <CardContent className="space-y-4">
          {/* Step-by-step guide inline */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">How do I submit an activity request?</h3>
            <StepByStepGuide />
          </div>

          {/* Preview FAQs */}
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.slice(0, 2).map((faq, index) => (
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
        <DialogContent className="max-w-lg max-h-[80vh] p-0 overflow-hidden">
          <ScrollArea className="max-h-[80vh]">
            <div className="p-6 space-y-4">
              <DialogHeader>
                <DialogTitle className="text-sro-primary flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Help Center
                </DialogTitle>
                <DialogDescription>
                  Learn how to use the SRO portal and find answers to common questions.
                </DialogDescription>
              </DialogHeader>

              {/* Full step-by-step guide */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">How do I submit an activity request?</h3>
                <StepByStepGuide />
              </div>

              {/* All FAQs */}
              <Accordion type="single" collapsible className="space-y-2">
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
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FAQCard;
