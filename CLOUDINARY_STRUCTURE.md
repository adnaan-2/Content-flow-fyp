# Cloudinary Folder Structure

Your Cloudinary account is now organized into clear sections:

## Folder Structure
```
contentflow/
├── profiles/          # User profile photos
│   ├── Automatic transformations: 400x400, face-centered crop
│   ├── File size limit: 5MB
│   └── Supported formats: JPEG, PNG, GIF, WebP
│
└── media/            # User uploaded media files
    ├── Automatic transformations: Max width 1200px
    ├── File size limit: 10MB
    └── Supported formats: JPEG, PNG, GIF, SVG, WebP
```

## API Endpoints

### Profile Photos
- **Upload:** `POST /api/profile/upload-photo`
- **Delete:** `DELETE /api/profile/delete-photo`

### Media Files
- **Upload:** `POST /api/media/upload`
- **Get all:** `GET /api/media`
- **Delete:** `DELETE /api/media/:id`

## Benefits of This Structure

1. **Easy Organization:** You can easily filter and manage different types of content
2. **Different Processing:** Profile photos get face-centered cropping, media files get size optimization
3. **Separate Limits:** Different file size limits for different use cases
4. **Clean URLs:** Your Cloudinary URLs will be organized and readable
5. **Easy Backup/Migration:** You can easily backup or manage specific content types

## Cloudinary Dashboard Access

In your Cloudinary dashboard, you'll see:
- `contentflow/profiles/` - All user profile photos
- `contentflow/media/` - All user uploaded media files

This makes it easy to:
- View analytics for each content type
- Apply different transformations
- Manage storage and bandwidth usage
- Create separate backup strategies
