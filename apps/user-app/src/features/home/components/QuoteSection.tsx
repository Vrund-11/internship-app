import { Heart } from "lucide-react";

const QuoteSection = () => {
  return (
    <section className="px-4 py-8">
      <div className="bg-secondary rounded-3xl p-6 text-center relative overflow-hidden lg:p-10">
        <div className="absolute top-2 right-3 text-4xl opacity-10">🐾</div>
        <Heart className="w-6 h-6 text-primary mx-auto mb-3 fill-primary/20" />
        <blockquote className="text-foreground font-medium text-sm leading-relaxed italic lg:text-lg lg:max-w-xl lg:mx-auto">
          &ldquo;Until one has loved an animal, a part of one&apos;s soul remains unawakened.&rdquo;
        </blockquote>
        <cite className="text-muted-foreground text-xs mt-2 block not-italic lg:text-sm lg:mt-3">
          — Anatole France
        </cite>
      </div>
    </section>
  );
};

export default QuoteSection;
