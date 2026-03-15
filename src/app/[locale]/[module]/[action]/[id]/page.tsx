import Form from "@/components/Form";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    locale: string;
    module: string;
    action: string;
    id: string;
  }>;
}

export default async function UniversalFormPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  if (!resolvedParams.module || !resolvedParams.action || !resolvedParams.id) {
    return notFound();
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center p-8 bg-background text-foreground overflow-y-auto">
      <div className="w-full max-w-4xl pt-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold capitalize tracking-tight">
            {resolvedParams.action.replace(/_/g, ' ')} {resolvedParams.module}
          </h1>
          <p className="text-default-500 mt-2">
            Schema-First Runtime Interface (V2)
          </p>
        </div>
        
        {/* Render polymorphic form engine */}
        <Form 
          moduleId={resolvedParams.module} 
          actionId={resolvedParams.action} 
          entityId={resolvedParams.id} 
        />
      </div>
    </div>
  );
}
