import { AnimatedContainer } from "@/components/ui/animated-container";
import { cn } from "@/lib/utils";

const PageWrapper = ({ title, description, children, className }) => {
  return (
    <AnimatedContainer className={cn("max-w-[1350px] mx-auto", className)}>
      {title && (
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </AnimatedContainer>
  );
};

export default PageWrapper;
