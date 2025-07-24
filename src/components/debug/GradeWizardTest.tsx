import React, { useState } from "react";
import SimpleGradeWizard, { SimpleGradeWizardProps } from "@/components/products/wizard/SimpleGradeWizard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductVariation } from "@/types/product";

const GradeWizardTest: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [testProductId, setTestProductId] = useState("test-product-123");
  const [testStoreId, setTestStoreId] = useState("test-store-456");
  const [category, setCategory] = useState("Test Category");
  const [productName, setProductName] = useState("Test Product");

  const handleVariationsChange = (newVariations: ProductVariation[]) => {
    console.log("Variations changed:", newVariations);
    setVariations(newVariations);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Grade Wizard Test</h1>
      <p>
        This is a test page for the SimpleGradeWizard component. You can
        trigger the wizard and see how it behaves.
      </p>

      <div className="space-y-2">
        <Label htmlFor="product-id">Product ID:</Label>
        <Input
          type="text"
          id="product-id"
          value={testProductId}
          onChange={(e) => setTestProductId(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="store-id">Store ID:</Label>
        <Input
          type="text"
          id="store-id"
          value={testStoreId}
          onChange={(e) => setTestStoreId(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category:</Label>
        <Input
          type="text"
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-name">Product Name:</Label>
        <Input
          type="text"
          id="product-name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
      </div>

      <Button onClick={() => setShowWizard(true)}>
        {showWizard ? "Close Wizard" : "Open Wizard"}
      </Button>

      {showWizard && (
        <SimpleGradeWizard
          variations={variations}
          onVariationsChange={handleVariationsChange}
          productId={testProductId}
          storeId={testStoreId}
          category={category}
          productName={productName}
          onClose={() => setShowWizard(false)}
          onSave={handleVariationsChange}
        />
      )}

      <div>
        <h2 className="text-xl font-semibold">Variations Preview:</h2>
        {variations.length > 0 ? (
          <pre>{JSON.stringify(variations, null, 2)}</pre>
        ) : (
          <p>No variations yet.</p>
        )}
      </div>
    </div>
  );
};

export default GradeWizardTest;
