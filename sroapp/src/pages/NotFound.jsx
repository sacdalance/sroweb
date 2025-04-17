import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-screen bg-white overflow-hidden">
      {/* Background image without cropping */}
      <img
        src="/sais-meme.png" // Make sure to match this with the latest file in /public
        alt="SAIS Meme"
        className="absolute bottom-0 w-full object-cover"
        style={{ maxHeight: "auto", height: "auto" }}
      />

      {/* Green heading - top right */}
      <div className="absolute top-10 right-12 text-right z-10">
        <h1 className="text-[64px] lg:text-[80px] font-extrabold text-green-600 leading-tight">
          UH-OH!
        </h1>
        <h2 className="text-[40px] lg:text-[56px] font-bold text-green-600">
          404 PAGE NOT FOUND
        </h2>
      </div>

      {/* Bottom-right caption + button */}
      <div className="absolute bottom-16 right-12 text-right z-10">
        <p className="text-lg lg:text-xl text-gray-700 mb-4">
          Please check the link or go back to the homepage.
        </p>
        <Button
          onClick={() => navigate("/")}
          className="cursor-pointer bg-[#7B1113] text-white px-6 py-3 text-base lg:text-lg font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:bg-[#5c0d0e]"
        >
          Back to Homepage
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
