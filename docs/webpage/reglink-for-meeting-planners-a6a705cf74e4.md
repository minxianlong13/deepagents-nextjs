<!-- source-url: https://support.cvent.com/s/communityarticle/RegLink-for-Meeting-Planners -->

# RegLink for Meeting Planners

[RegLink](https://support.cvent.com/s/communityarticle/About-RegLink) is a set of open application programming interfaces (APIs) that allows an event registration system to connect to Passkey's online hotel reservation system for a unified event booking experience. As a meeting planner, integrating attendee registration and housing can help you address some of the main challenges typically encountered when organizing an event, such as:  
 

-    Pre-populating an attendee's personal information from the registration site to Passkey's booking website.
-    Discouraging attendees from booking outside the contracted block by automatically directing attendees to reserve housing.
-    Running reports to track who registered, who booked a room, and who has done both.
-    Sending email notifications (campaigns) to attendees who have registered but have not yet reserved a hotel room to ensure they stay in the contracted block.
-    Promoting earlier pickup.

What will it cost me or my organization?  
If your organization has purchased a Passkey license, you can choose to have RegLink included as an optional module. Contact your account manager for more details.

If, however, you work with a Passkey licensee such as the contracted hotel or third-party organization to manage housing for your event attendees, there is no extra cost for you to use the RegLink integration.

How do I get started?  
Contact either the licensed hotel or organization managing housing for your event and tell them you want to connect your event registration to Passkey. Specify what registration system provider you are working with.

If your registration system provider is [Cvent](https://support.cvent.com/s/communityarticle/The-Complete-Guide-to-Integrating-Events-with-Passkey) or [an organization that is already integrated with Passkey](https://support.cvent.com/s/communityarticle/Which-Event-Registration-Providers-are-Integrated-with-Passkey), it will be the hotel's responsibility to [enable RegLink in the Passkey event](https://support.cvent.com/s/communityarticle/Enabling-RegLink-in-a-Passkey-Event).

If the registration system you are using is not integrated with Passkey, the first step is to identify the goals of the integration between the registration system and Passkey. This is important for the registration provider to understand so they can best decide how to implement the RegLink integration. The RegLink module offers a few levels of integration ranging from very basic to advanced:

-   **RegExpress** - If you do not require reports on who registered but hasn't booked housing, tell the registration provider you want this option, a simple approach that requires minimal development.
-   **RegLink Basic** - If you would like RegLink reports, tell the registration provider you want this option.
-   **RegLink Advanced** - Tell the registration provider you want this option if you need all the features provided in RegExpress and Reglink Basic integrations as well as the ability for a third-party application to complete all aspects of the attendee creation and reservation process.

**NOTE:** RegLink Advanced takes longer to complete and requires more testing to ensure all supported features work as expected.

  
You can request the following à la carte features:  
 

-   **[Callbacks](https://support.cvent.com/s/communityarticle/Adding-Callbacks-for-Reglink)** - Whether you requested for RegExpress or RegLink Basic, let the registration company know if you want the registration system to expose a link to allow guests to modify reservations or provide reporting in the registration system.
-   **Get Reservation** - If callbacks are supported, the registration partner can retrieve housing reservation information from Passkey using this feature. This can be used for various purposes within the registration platform including, but not limited to, displaying individual housing details, reporting, or providing joint confirmation functionality.

  
Once you have communicated what you are looking to accomplish, have the registration company access the [RegLink API documentation](https://developers.cvent.com/documentation#tag/Housing).
