export const validateLicense = async ({
  licenseKey,
}: {
  licenseKey: string;
}): Promise<boolean | undefined> => {
  if (!licenseKey) {
    throw new Error(
      "License key not initialized. Call initializeLicense first"
    );
  }

  try {
    const response = await fetch("http://localhost:3001/api/validate-license", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ licenseKey }),
    });

    // Check for HTTP status codes
    if (response.status >= 500) {
      throw new Error("Server error occurred");
    }

    if (response.status === 404) {
      throw new Error("API endpoint not found");
    }

    const data = await response.json();

    if (!data?.isValid) {
      throw new Error("Invalid license key");
    }

    // Check if the response has the expected structure
    return data.isValid;
  } catch (error) {
    console.error("License validation error:", error);
    return false;
  }
};
