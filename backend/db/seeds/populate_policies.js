exports.seed = async function (knex) {
  await knex('policies').del();
  await knex('policies').insert([
    {
      version: '1.0',
      type: 'terms',
      content: `1. Terms of Use v1.0 (2024-12-31)
        1.1 Effective Date
        This Terms of Use is effective as of January 1, 2025.
        1.2 Acceptance of Terms
        By accessing or using this demo application, you agree to comply with these Terms of Use.
        1.3 Purpose of the Application
        This application is for demonstration purposes only and should not be used in production or for storing sensitive information.
        1.4 Restrictions
        - You agree not to misuse the application or attempt to breach its security.
        - You must not use this demo to store or process real-world sensitive data.
        1.5 Intellectual Property
        All content, code, and design elements in this application are the intellectual property of the demo provider and cannot be used without permission.
        1.6 Disclaimer of Warranty
        This application is provided "as is," without any warranties, express or implied, including but not limited to fitness for a particular purpose.
        1.7 Limitation of Liability
        The demo provider shall not be liable for any damages arising out of your use or inability to use this application.
        1.8 Changes to Terms
        We reserve the right to modify these Terms of Use at any time. Continued use of the application signifies acceptance of any updated terms.
      `,
      effective_date: '2025-01-01',
    },
    {
      version: '1.0',
      type: 'privacy',
      content: `1. Privacy Policy v1.0
        1.1 Effective Date
        This Privacy Policy is effective as of January 1, 2025.
        1.2 Information We Collect
        - Email Address: Collected during registration to demonstrate authentication functionality.
        - Usage Data: Includes IP address, browser type, and interaction logs for improving the demo experience.
        1.3 How We Use Your Information
        Your information is used solely to demonstrate the app's features and is not shared with third parties.
        1.4 Data Retention
        All data submitted is stored temporarily and automatically deleted after 30 days.
        1.5 Security Measures
        We implement basic security measures to protect your data. However, this is a demo application and is not intended for production use.
        1.6 Your Rights
        You have the right to request data deletion or inquire about how your data is handled by contacting us at demo@example.com.
        `,
      effective_date: '2025-01-01',
    },
  ]);
};
