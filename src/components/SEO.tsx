import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export default function SEO({ 
  title = "Waziru Blog - Personal Portfolio & Blog", 
  description = "Welcome to Waziru's personal portfolio and blog. Explore my projects and read my latest thoughts on technology.", 
  keywords = "blog, portfolio, technology, software development, waziru",
  image = "https://picsum.photos/seed/blog/1200/630",
  url = window.location.href,
  type = "website"
}: SEOProps) {
  const siteTitle = title.includes("Waziru") ? title : `${title} | Waziru Blog`;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </Helmet>
  );
}
