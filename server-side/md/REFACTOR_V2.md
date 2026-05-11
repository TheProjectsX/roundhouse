## Context

This project has too many connected models and nested requests. Many of the routes are longer cause they are nested. The nested routes are mostly not needed as they can be independent path.

## Goal

Read the routes and controllers. Group the controller , services under same module if they are working with the same model, but it also does need to have matching paths with meaning. For example:

- /apikeys/:id - CORRECT
- /providers/:id - CORRECT
- /selections/:id - UNSURE. Better:
    - /providers/selections:id
    - /models/selections/:id

These are just example structures, take them as inspiration only.

## Structuring

Instead of pushing everything in one module:

- Group modules by model they are working on.
- Connect the services with the parent controller if applicable (As `admin` controllers)
- The modules which only holds services and controller is just placeholder (ain't using to point to the service), name the folders with underscore: "_module-name"


## FOLLOW UP
You moved the admin providers module from "admin" to "providers". I get it why you did that, but that becomes inconsistant.

Better Structure?:

admin/providers/providers...ts
          admin......ts

So, the providers that admin are using, are staying under the admin module as sub module. Not in providers module as exported modules.

So if "/admin" is using some provider features, it may be under admin module
if "/me" is usig some provider features, it may be under me module