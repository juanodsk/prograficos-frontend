import { useEffect } from "react";

const ensureMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

const ensureLink = (selector, attributes) => {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

const Seo = ({
  title,
  description,
  keywords,
  image = "/logo_pr.png",
  type = "website",
  structuredData,
}) => {
  useEffect(() => {
    const previousTitle = document.title;
    const canonicalUrl = window.location.href;
    const imageUrl = new URL(image, window.location.origin).href;

    document.title = title;

    ensureMeta('meta[name="description"]', {
      name: "description",
      content: description,
    });
    ensureMeta('meta[name="keywords"]', {
      name: "keywords",
      content: keywords,
    });
    ensureMeta('meta[name="robots"]', {
      name: "robots",
      content: "index, follow",
    });
    ensureMeta('meta[property="og:title"]', {
      property: "og:title",
      content: title,
    });
    ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description,
    });
    ensureMeta('meta[property="og:type"]', {
      property: "og:type",
      content: type,
    });
    ensureMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonicalUrl,
    });
    ensureMeta('meta[property="og:image"]', {
      property: "og:image",
      content: imageUrl,
    });
    ensureMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary",
    });
    ensureMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: title,
    });
    ensureMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description,
    });
    ensureMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: imageUrl,
    });
    ensureLink('link[rel="canonical"]', {
      rel: "canonical",
      href: canonicalUrl,
    });

    const previousStructuredData = document.getElementById(
      "prograficos-structured-data",
    );

    if (previousStructuredData) {
      previousStructuredData.remove();
    }

    if (structuredData) {
      const script = document.createElement("script");
      script.id = "prograficos-structured-data";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      document.title = previousTitle;

      const currentStructuredData = document.getElementById(
        "prograficos-structured-data",
      );

      if (currentStructuredData) {
        currentStructuredData.remove();
      }
    };
  }, [description, image, keywords, structuredData, title, type]);

  return null;
};

export default Seo;
