const PROPERTIES = PropertiesService.getScriptProperties();

const BOM_OS_ROOT_NAME = "BOMSociety OS";
const BOM_OS_ROOT_PROPERTY = "BOM_OS_ROOT_FOLDER_ID";

const BOM_OS_DEFAULT_FOLDERS = [
  "00_MASTER",
  "01_DESIGN_SYSTEM",
  "02_COMPONENTS",
  "03_SCHEMAS",
  "04_CONTENT",
  "05_THEME",
  "06_CONNECTOR",
  "07_AUTOMATIONS",
  "08_ANALYTICS",
  "09_PRODUCTS",
  "10_RELEASES",
  "11_BACKUPS",
  "12_MEDIA"
];

function testConnection() {
  const result = ghostRequest_("site/", "get");

  Logger.log("CONNECTION SUCCESSFUL");
  Logger.log(JSON.stringify(result, null, 2));
}

function doGet(e) {
  try {
    const token =
      e &&
      e.parameter &&
      e.parameter.connector_token
        ? e.parameter.connector_token
        : "";

    validateConnectorToken_(token);

    const action =
      e &&
      e.parameter &&
      e.parameter.action
        ? e.parameter.action
        : "test";

    if (action === "test") {
      const result = ghostRequest_("site/", "get");
      const site = result.site;

      return jsonResponse_({
        success: true,
        action: "test",
        site: {
          title: site.title,
          description: site.description,
          logo: site.logo,
          icon: site.icon,
          cover_image: site.cover_image,
          accent_color: site.accent_color,
          locale: site.locale,
          url: site.url,
          version: site.version
        }
      });
    }

    return jsonResponse_({
      success: false,
      error: "Unsupported GET action: " + action
    });
  } catch (error) {
    return jsonResponse_({
      success: false,
      error: String(error.message || error)
    });
  }
}

function doPost(e) {
  try {
    const request = parseRequest_(e);

    validateConnectorToken_(request.connector_token);

    const action = requireText_(
      request.action,
      "action"
    );

    if (action === "test") {
      return handleTest_();
    }

    if (action === "list_posts") {
      return handleListPosts_(request);
    }

    if (action === "list_pages") {
      return handleListPages_(request);
    }

    if (action === "create_draft") {
      return handleCreateDraft_(request);
    }

    if (action === "publish_post") {
      return handlePublishPost_(request);
    }

    if (action === "upsert_page") {
      return handleUpsertPage_(request);
    }

    if (action === "get_page") {
      return jsonResponse_({
        success: true,
        action: action,
        page: getPage_(request)
      });
    }

    if (action === "site_settings") {
      return jsonResponse_(
        getSiteSettings_()
      );
    }

    if (action === "theme_info") {
      return jsonResponse_(
        getThemeInfo_()
      );
    }

    if (action === "drive_setup") {
      return jsonResponse_(
        driveSetup_()
      );
    }

    if (action === "drive_status") {
      return jsonResponse_(
        driveStatus_()
      );
    }

    if (action === "list_files") {
      return jsonResponse_(
        listFiles_(request)
      );
    }

    if (action === "read_file") {
      return jsonResponse_(
        readFile_(request)
      );
    }

    if (action === "write_file") {
      return jsonResponse_(
        writeFile_(request)
      );
    }

    if (action === "mkdir") {
      return jsonResponse_(
        makeDirectory_(request)
      );
    }

    if (action === "move_file") {
      return jsonResponse_(
        moveFile_(request)
      );
    }

    if (action === "delete_file") {
      return jsonResponse_(
        deleteFile_(request)
      );
    }

    if (action === "copy_file") {
      return jsonResponse_(
        copyFile_(request)
      );
    }

    if (action === "zip_project") {
  return jsonResponse_(
    zipProject_(request)
  );
}

if (action === "write_project") {
  return jsonResponse_(
    writeProject_(request)
  );
}

if (action === "read_project") {
  return jsonResponse_(
    readProject_(request)
  );
}

throw new Error(
  "Unsupported action: " + action
);

} catch (error) {

  return jsonResponse_({
    success: false,
    error: String(error.message || error)
  });

}

}

function handleTest_() {
  const result = ghostRequest_("site/", "get");
  const site = result.site;
  return jsonResponse_({
    success: true,
    action: "test",
    site: {
      title: site.title,
      description: site.description,
      url: site.url,
      version: site.version
    }
  });
}

function handleListPosts_(request) {
  const limit = clampLimit_(request.limit);

  const result = ghostRequest_(
    "posts/?limit=" +
      encodeURIComponent(limit) +
      "&fields=id,title,slug,status,url,updated_at",
    "get"
  );

  return jsonResponse_({
    success: true,
    action: "list_posts",
    posts: result.posts
  });
}

function handleListPages_(request) {
  const limit = clampLimit_(request.limit);

  const result = ghostRequest_(
    "pages/?limit=" +
      encodeURIComponent(limit) +
      "&fields=id,title,slug,status,url,updated_at",
    "get"
  );

  return jsonResponse_({
    success: true,
    action: "list_pages",
    pages: result.pages
  });
}

function handleCreateDraft_(request) {
  const result = ghostRequest_(
    "posts/?source=html",
    "post",
    {
      posts: [
        {
          title: requireText_(
            request.title,
            "title"
          ),
          slug: optionalSlug_(request.slug),
          html: requireText_(
            request.html,
            "html"
          ),
          status: "draft",
          custom_excerpt: optionalText_(
            request.custom_excerpt
          ),
          tags: normalizeTags_(
            request.tags
          )
        }
      ]
    }
  );

  const post = result.posts[0];

  return jsonResponse_({
    success: true,
    action: "create_draft",
    operation: "created",
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    url: post.url
  });
}

function handlePublishPost_(request) {
  requirePublishConfirmation_(request);

  const result = ghostRequest_(
    "posts/?source=html",
    "post",
    {
      posts: [
        {
          title: requireText_(
            request.title,
            "title"
          ),
          slug: optionalSlug_(request.slug),
          html: requireText_(
            request.html,
            "html"
          ),
          status: "published",
          custom_excerpt: optionalText_(
            request.custom_excerpt
          ),
          tags: normalizeTags_(
            request.tags
          )
        }
      ]
    }
  );

  const post = result.posts[0];

  return jsonResponse_({
    success: true,
    action: "publish_post",
    operation: "created",
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    url: post.url
  });
}

function handleUpsertPage_(request) {
  const title = requireText_(
    request.title,
    "title"
  );

  const slug = normalizeSlug_(
    request.slug || title
  );

  const html = requireText_(
    request.html,
    "html"
  );

  const status =
    request.status === "published"
      ? "published"
      : "draft";

  if (status === "published") {
    requirePublishConfirmation_(request);
  }

  const existingPage = findPageBySlug_(slug);

  if (existingPage) {
    const result = ghostRequest_(
      "pages/" +
        encodeURIComponent(existingPage.id) +
        "/?source=html",
      "put",
      {
        pages: [
          {
            title: title,
            slug: slug,
            html: html,
            status: status,
            updated_at:
              existingPage.updated_at,
            custom_excerpt:
              optionalText_(
                request.custom_excerpt
              )
          }
        ]
      }
    );

    const page = result.pages[0];

    return jsonResponse_({
      success: true,
      action: "upsert_page",
      operation: "updated",
      id: page.id,
      title: page.title,
      slug: page.slug,
      status: page.status,
      url: page.url,
      updated_at: page.updated_at
    });
  }

  const result = ghostRequest_(
    "pages/?source=html",
    "post",
    {
      pages: [
        {
          title: title,
          slug: slug,
          html: html,
          status: status,
          custom_excerpt:
            optionalText_(
              request.custom_excerpt
            )
        }
      ]
    }
  );

  const page = result.pages[0];

  return jsonResponse_({
    success: true,
    action: "upsert_page",
    operation: "created",
    id: page.id,
    title: page.title,
    slug: page.slug,
    status: page.status,
    url: page.url,
    updated_at: page.updated_at
  });
}

function getPage_(request) {
  const id = optionalText_(request.id);
  const slug = optionalSlug_(request.slug);

  if (!id && !slug) {
    throw new Error(
      "get_page requires id or slug."
    );
  }

  const endpoint = id
    ? "pages/" +
      encodeURIComponent(id) +
      "/?formats=html"
    : "pages/slug/" +
      encodeURIComponent(slug) +
      "/?formats=html";

  const result = ghostRequest_(
    endpoint,
    "get"
  );

  const pages = result.pages || [];

  if (!pages.length) {
    throw new Error(
      "Page not found."
    );
  }

  const page = pages[0];

  return {
    id: page.id || null,
    title: page.title || null,
    slug: page.slug || null,
    status: page.status || null,
    url: page.url || null,
    html: page.html || null,
    custom_excerpt:
      page.custom_excerpt || null,
    feature_image:
      page.feature_image || null,
    visibility:
      page.visibility || null,
    access:
      page.access || null,
    published_at:
      page.published_at || null,
    updated_at:
      page.updated_at || null,
    meta_title:
      page.meta_title || null,
    meta_description:
      page.meta_description || null,
    og_title:
      page.og_title || null,
    og_description:
      page.og_description || null,
    og_image:
      page.og_image || null,
    twitter_title:
      page.twitter_title || null,
    twitter_description:
      page.twitter_description || null,
    twitter_image:
      page.twitter_image || null,
    canonical_url:
      page.canonical_url || null
  };
}

function getSiteSettings_() {
  const siteResult = ghostRequest_(
    "site/",
    "get"
  );

  const site = siteResult.site || {};

  const settingsAttempt =
    ghostRequestSafe_(
      "settings/?type=blog",
      "get"
    );

  const settings = settingsAttempt.ok
    ? settingsAttempt.data.settings || {}
    : null;

  return {
    success: true,
    action: "site_settings",
    site: {
      title: site.title || null,
      description:
        site.description || null,
      logo: site.logo || null,
      icon: site.icon || null,
      cover_image:
        site.cover_image || null,
      accent_color:
        site.accent_color || null,
      locale: site.locale || null,
      url: site.url || null,
      version: site.version || null
    },
    settings: settings,
    settings_accessible:
      settingsAttempt.ok,
    settings_error:
      settingsAttempt.ok
        ? null
        : settingsAttempt.error,
    confirmed: {
      site_endpoint: true,
      settings_endpoint:
        settingsAttempt.ok
    },
    note:
      settingsAttempt.ok
        ? "Settings were returned by Ghost."
        : "The integration can read /site/, but Ghost did not permit or expose /settings/ to this integration."
  };
}

function getThemeInfo_() {
  const siteResult = ghostRequest_(
    "site/",
    "get"
  );

  const site = siteResult.site || {};

  const themesAttempt =
    ghostRequestSafe_(
      "themes/",
      "get"
    );

  const settingsAttempt =
    ghostRequestSafe_(
      "settings/?type=blog",
      "get"
    );

  const themes =
    themesAttempt.ok &&
    Array.isArray(
      themesAttempt.data.themes
    )
      ? themesAttempt.data.themes
      : [];

  let activeTheme = null;

  for (
    let i = 0;
    i < themes.length;
    i++
  ) {
    if (themes[i].active === true) {
      activeTheme = themes[i];
      break;
    }
  }

  const settings =
    settingsAttempt.ok
      ? settingsAttempt.data.settings || {}
      : {};

  if (
    !activeTheme &&
    settings &&
    settings.active_theme
  ) {
    activeTheme = {
      name: settings.active_theme,
      active: true
    };
  }

  return {
    success: true,
    action: "theme_info",
    site_url: site.url || null,
    ghost_version:
      site.version || null,
    active_theme: activeTheme
      ? {
          name:
            activeTheme.name || null,
          version:
            activeTheme.package &&
            activeTheme.package.version
              ? activeTheme.package.version
              : null,
          package:
            activeTheme.package || null,
          templates:
            activeTheme.templates || null,
          active:
            activeTheme.active === true
        }
      : null,
    themes_accessible:
      themesAttempt.ok,
    themes_error:
      themesAttempt.ok
        ? null
        : themesAttempt.error,
    settings_accessible:
      settingsAttempt.ok,
    settings_error:
      settingsAttempt.ok
        ? null
        : settingsAttempt.error,
    homepage: {
      confirmed_source: "home.hbs",
      confirmed_by_api: false,
      inference:
        "The site homepage is rendered by home.hbs in the active custom theme."
    }
  };
}

function driveSetup_() {
  const root = getOrCreateRootFolder_();

  const created = [];
  const existing = [];

  BOM_OS_DEFAULT_FOLDERS.forEach(
    function(folderName) {
      const folders =
        root.getFoldersByName(folderName);

      if (folders.hasNext()) {
        existing.push(folderName);
      } else {
        root.createFolder(folderName);
        created.push(folderName);
      }
    }
  );

  const manifest = {
    system: "BOMSociety OS",
    version: "1.0.0",
    workspace_type: "google_drive",
    root_folder_id: root.getId(),
    root_folder_name: root.getName(),
    initialized_at:
      new Date().toISOString(),
    folders: BOM_OS_DEFAULT_FOLDERS
  };

  upsertTextFileInFolder_(
    root,
    "bomsociety-os-manifest.json",
    JSON.stringify(manifest, null, 2),
    MimeType.PLAIN_TEXT,
    true
  );

  return {
    success: true,
    action: "drive_setup",
    root_folder_id: root.getId(),
    root_folder_name: root.getName(),
    root_url: root.getUrl(),
    created_folders: created,
    existing_folders: existing,
    manifest:
      "bomsociety-os-manifest.json"
  };
}

function driveStatus_() {
  const root = getRootFolder_();

  if (!root) {
    return {
      success: true,
      action: "drive_status",
      configured: false,
      root_folder_id: null,
      root_folder_name: null,
      root_url: null
    };
  }

  return {
    success: true,
    action: "drive_status",
    configured: true,
    root_folder_id: root.getId(),
    root_folder_name: root.getName(),
    root_url: root.getUrl(),
    folders:
      listFolderChildren_(root)
  };
}

function listFiles_(request) {
  const path = normalizeDrivePath_(
    request.path || ""
  );

  const folder = resolveFolderPath_(
    path,
    false
  );

  if (!folder) {
    throw new Error(
      "Folder not found: " + path
    );
  }

  const recursive =
    request.recursive === true;

  const maxDepth =
    clampDriveDepth_(
      request.max_depth
    );

  const items = recursive
    ? listFolderRecursive_(
        folder,
        path,
        0,
        maxDepth
      )
    : listFolderChildren_(folder);

  return {
    success: true,
    action: "list_files",
    path: path,
    folder_id: folder.getId(),
    folder_url: folder.getUrl(),
    recursive: recursive,
    items: items
  };
}

function readFile_(request) {
  const path = requireDrivePath_(
    request.path,
    "path"
  );

  const file = resolveFilePath_(path);

  if (!file) {
    throw new Error(
      "File not found: " + path
    );
  }

  const blob = file.getBlob();
  const mimeType = file.getMimeType();
  const size = file.getSize();

  const maxBytes =
    clampReadBytes_(
      request.max_bytes
    );

  if (size > maxBytes) {
    throw new Error(
      "File exceeds max_bytes. File size: " +
        size +
        " bytes. max_bytes: " +
        maxBytes
    );
  }

  let content;
  let encoding = "utf-8";

  if (isTextMimeType_(mimeType)) {
    content = blob.getDataAsString("UTF-8");
  } else {
    content =
      Utilities.base64Encode(
        blob.getBytes()
      );
    encoding = "base64";
  }

  return {
    success: true,
    action: "read_file",
    path: path,
    id: file.getId(),
    name: file.getName(),
    mime_type: mimeType,
    size_bytes: size,
    encoding: encoding,
    content: content,
    updated_at:
      file.getLastUpdated().toISOString(),
    url: file.getUrl()
  };
}

function writeFile_(request) {
  const path = requireDrivePath_(
    request.path,
    "path"
  );

  if (
    typeof request.contents !== "string"
  ) {
    throw new Error(
      "write_file requires contents as a string."
    );
  }

  const overwrite =
    request.overwrite !== false;

  const encoding =
    optionalText_(request.encoding) ||
    "utf-8";

  const pathParts =
    splitDrivePath_(path);

  const filename = pathParts.pop();

  if (!filename) {
    throw new Error(
      "write_file requires a filename."
    );
  }

  const folderPath =
    pathParts.join("/");

  const folder = resolveFolderPath_(
    folderPath,
    true
  );

  const mimeType =
    optionalText_(request.mime_type) ||
    inferMimeType_(filename);

  let blob;

  if (encoding === "base64") {
    const bytes =
      Utilities.base64Decode(
        request.contents
      );

    blob = Utilities.newBlob(
      bytes,
      mimeType,
      filename
    );
  } else {
    blob = Utilities.newBlob(
      request.contents,
      mimeType,
      filename
    );
  }

  const files =
    folder.getFilesByName(filename);

  if (files.hasNext()) {
    const existing = files.next();

    if (!overwrite) {
      throw new Error(
        "File already exists and overwrite=false: " +
          path
      );
    }

    existing.setContent(
      encoding === "base64"
        ? blob.getDataAsString()
        : request.contents
    );

    return {
      success: true,
      action: "write_file",
      operation: "updated",
      path: path,
      id: existing.getId(),
      name: existing.getName(),
      mime_type: existing.getMimeType(),
      size_bytes: existing.getSize(),
      updated_at:
        existing
          .getLastUpdated()
          .toISOString(),
      url: existing.getUrl()
    };
  }

  const file =
    folder.createFile(blob);

  return {
    success: true,
    action: "write_file",
    operation: "created",
    path: path,
    id: file.getId(),
    name: file.getName(),
    mime_type: file.getMimeType(),
    size_bytes: file.getSize(),
    updated_at:
      file
        .getLastUpdated()
        .toISOString(),
    url: file.getUrl()
  };
}

function makeDirectory_(request) {
  const path = requireDrivePath_(
    request.path,
    "path"
  );

  const existing =
    resolveFolderPath_(
      path,
      false
    );

  if (existing) {
    return {
      success: true,
      action: "mkdir",
      operation: "existing",
      path: path,
      id: existing.getId(),
      name: existing.getName(),
      url: existing.getUrl()
    };
  }

  const folder =
    resolveFolderPath_(
      path,
      true
    );

  return {
    success: true,
    action: "mkdir",
    operation: "created",
    path: path,
    id: folder.getId(),
    name: folder.getName(),
    url: folder.getUrl()
  };
}

function moveFile_(request) {
  const sourcePath =
    requireDrivePath_(
      request.source_path,
      "source_path"
    );

  const destinationPath =
    requireDrivePath_(
      request.destination_path,
      "destination_path"
    );

  const file =
    resolveFilePath_(sourcePath);

  if (!file) {
    throw new Error(
      "Source file not found: " +
        sourcePath
    );
  }

  const destinationParts =
    splitDrivePath_(destinationPath);

  let destinationName =
    destinationParts.pop();

  const destinationFolderPath =
    destinationParts.join("/");

  const destinationFolder =
    resolveFolderPath_(
      destinationFolderPath,
      true
    );

  if (!destinationName) {
    destinationName =
      file.getName();
  }

  const conflicts =
    destinationFolder.getFilesByName(
      destinationName
    );

  if (conflicts.hasNext()) {
    if (request.overwrite !== true) {
      throw new Error(
        "Destination file exists. Set overwrite=true to replace it: " +
          destinationPath
      );
    }

    while (conflicts.hasNext()) {
      conflicts.next().setTrashed(true);
    }
  }

  file.moveTo(destinationFolder);

  if (
    destinationName !== file.getName()
  ) {
    file.setName(destinationName);
  }

  return {
    success: true,
    action: "move_file",
    operation: "moved",
    source_path: sourcePath,
    destination_path:
      destinationFolderPath
        ? destinationFolderPath +
          "/" +
          destinationName
        : destinationName,
    id: file.getId(),
    name: file.getName(),
    url: file.getUrl()
  };
}

function copyFile_(request) {
  const sourcePath =
    requireDrivePath_(
      request.source_path,
      "source_path"
    );

  const destinationPath =
    requireDrivePath_(
      request.destination_path,
      "destination_path"
    );

  const source =
    resolveFilePath_(sourcePath);

  if (!source) {
    throw new Error(
      "Source file not found: " +
        sourcePath
    );
  }

  const destinationParts =
    splitDrivePath_(destinationPath);

  let destinationName =
    destinationParts.pop();

  const destinationFolderPath =
    destinationParts.join("/");

  const destinationFolder =
    resolveFolderPath_(
      destinationFolderPath,
      true
    );

  if (!destinationName) {
    destinationName =
      source.getName();
  }

  const conflicts =
    destinationFolder.getFilesByName(
      destinationName
    );

  if (conflicts.hasNext()) {
    if (request.overwrite !== true) {
      throw new Error(
        "Destination file exists. Set overwrite=true to replace it: " +
          destinationPath
      );
    }

    while (conflicts.hasNext()) {
      conflicts.next().setTrashed(true);
    }
  }

  const copy =
    source.makeCopy(
      destinationName,
      destinationFolder
    );

  return {
    success: true,
    action: "copy_file",
    operation: "copied",
    source_path: sourcePath,
    destination_path:
      destinationFolderPath
        ? destinationFolderPath +
          "/" +
          destinationName
        : destinationName,
    id: copy.getId(),
    name: copy.getName(),
    mime_type: copy.getMimeType(),
    size_bytes: copy.getSize(),
    url: copy.getUrl()
  };
}

function deleteFile_(request) {
  const path = requireDrivePath_(
    request.path,
    "path"
  );

  if (request.confirm_delete !== true) {
    throw new Error(
      "Deleting requires confirm_delete=true."
    );
  }

  const file =
    resolveFilePath_(path);

  if (file) {
    const metadata = {
      id: file.getId(),
      name: file.getName(),
      url: file.getUrl()
    };

    file.setTrashed(true);

    return {
      success: true,
      action: "delete_file",
      operation: "trashed_file",
      path: path,
      file: metadata
    };
  }

  const folder =
    resolveFolderPath_(
      path,
      false
    );

  if (!folder) {
    throw new Error(
      "File or folder not found: " +
        path
    );
  }

  const root = getOrCreateRootFolder_();

  if (folder.getId() === root.getId()) {
    throw new Error(
      "The BOMSociety OS root folder cannot be deleted."
    );
  }

  const metadata = {
    id: folder.getId(),
    name: folder.getName(),
    url: folder.getUrl()
  };

  folder.setTrashed(true);

  return {
    success: true,
    action: "delete_file",
    operation: "trashed_folder",
    path: path,
    folder: metadata
  };
}

function zipProject_(request) {
  const sourcePath =
    normalizeDrivePath_(
      request.path || ""
    );

  const sourceFolder =
    resolveFolderPath_(
      sourcePath,
      false
    );

  if (!sourceFolder) {
    throw new Error(
      "Folder not found: " +
        sourcePath
    );
  }

  const requestedName =
    optionalText_(
      request.zip_name
    );

  const timestamp =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() ||
        "America/Chicago",
      "yyyyMMdd-HHmmss"
    );

  const zipName =
    requestedName
      ? ensureZipExtension_(
          requestedName
        )
      : "BOMSociety-OS-" +
        timestamp +
        ".zip";

  const blobs = [];

  collectFolderBlobs_(
    sourceFolder,
    sourceFolder.getName(),
    blobs
  );

  if (!blobs.length) {
    throw new Error(
      "Cannot create ZIP because the folder contains no files."
    );
  }

  const zipBlob =
    Utilities.zip(
      blobs,
      zipName
    );

  const releaseFolder =
    resolveFolderPath_(
      "10_RELEASES",
      true
    );

  const existing =
    releaseFolder.getFilesByName(
      zipName
    );

  while (existing.hasNext()) {
    existing.next().setTrashed(true);
  }

  const zipFile =
    releaseFolder.createFile(zipBlob);

  return {
    success: true,
    action: "zip_project",
    operation: "created",
    source_path: sourcePath,
    zip_path:
      "10_RELEASES/" +
      zipName,
    id: zipFile.getId(),
    name: zipFile.getName(),
    size_bytes: zipFile.getSize(),
    file_count: blobs.length,
    url: zipFile.getUrl()
  };
}

function getOrCreateRootFolder_() {
  const existing = getRootFolder_();

  if (existing) {
    return existing;
  }

  const folders =
    DriveApp.getFoldersByName(
      BOM_OS_ROOT_NAME
    );

  let root;

  if (folders.hasNext()) {
    root = folders.next();
  } else {
    root =
      DriveApp.createFolder(
        BOM_OS_ROOT_NAME
      );
  }

  PROPERTIES.setProperty(
    BOM_OS_ROOT_PROPERTY,
    root.getId()
  );

  return root;
}

function getRootFolder_() {
  const folderId =
    PROPERTIES.getProperty(
      BOM_OS_ROOT_PROPERTY
    );

  if (!folderId) {
    return null;
  }

  try {
    const folder =
      DriveApp.getFolderById(
        folderId
      );

    if (folder.isTrashed()) {
      PROPERTIES.deleteProperty(
        BOM_OS_ROOT_PROPERTY
      );

      return null;
    }

    return folder;
  } catch (error) {
    PROPERTIES.deleteProperty(
      BOM_OS_ROOT_PROPERTY
    );

    return null;
  }
}

function resolveFolderPath_(
  path,
  createMissing
) {
  const root =
    getOrCreateRootFolder_();

  const normalized =
    normalizeDrivePath_(path);

  if (!normalized) {
    return root;
  }

  const parts =
    splitDrivePath_(normalized);

  let current = root;

  for (
    let i = 0;
    i < parts.length;
    i++
  ) {
    const part = parts[i];

    const folders =
      current.getFoldersByName(part);

    if (folders.hasNext()) {
      current = folders.next();
    } else {
      if (!createMissing) {
        return null;
      }

      current =
        current.createFolder(part);
    }
  }

  return current;
}

function resolveFilePath_(path) {
  const normalized =
    normalizeDrivePath_(path);

  const parts =
    splitDrivePath_(normalized);

  const filename = parts.pop();

  if (!filename) {
    return null;
  }

  const folderPath =
    parts.join("/");

  const folder =
    resolveFolderPath_(
      folderPath,
      false
    );

  if (!folder) {
    return null;
  }

  const files =
    folder.getFilesByName(
      filename
    );

  if (!files.hasNext()) {
    return null;
  }

  return files.next();
}

function listFolderChildren_(folder) {
  const items = [];

  const folders =
    folder.getFolders();

  while (folders.hasNext()) {
    const child =
      folders.next();

    items.push({
      type: "folder",
      id: child.getId(),
      name: child.getName(),
      url: child.getUrl(),
      updated_at:
        child
          .getLastUpdated()
          .toISOString()
    });
  }

  const files =
    folder.getFiles();

  while (files.hasNext()) {
    const file =
      files.next();

    items.push({
      type: "file",
      id: file.getId(),
      name: file.getName(),
      mime_type:
        file.getMimeType(),
      size_bytes:
        file.getSize(),
      url: file.getUrl(),
      updated_at:
        file
          .getLastUpdated()
          .toISOString()
    });
  }

  items.sort(function(a, b) {
    if (a.type !== b.type) {
      return a.type === "folder"
        ? -1
        : 1;
    }

    return a.name.localeCompare(
      b.name
    );
  });

  return items;
}

function listFolderRecursive_(
  folder,
  basePath,
  depth,
  maxDepth
) {
  const items = [];

  if (depth > maxDepth) {
    return items;
  }

  const folders =
    folder.getFolders();

  while (folders.hasNext()) {
    const child =
      folders.next();

    const childPath =
      basePath
        ? basePath +
          "/" +
          child.getName()
        : child.getName();

    items.push({
      type: "folder",
      path: childPath,
      id: child.getId(),
      name: child.getName(),
      url: child.getUrl(),
      updated_at:
        child
          .getLastUpdated()
          .toISOString()
    });

    if (depth < maxDepth) {
      const nested =
        listFolderRecursive_(
          child,
          childPath,
          depth + 1,
          maxDepth
        );

      Array.prototype.push.apply(
        items,
        nested
      );
    }
  }

  const files =
    folder.getFiles();

  while (files.hasNext()) {
    const file =
      files.next();

    const filePath =
      basePath
        ? basePath +
          "/" +
          file.getName()
        : file.getName();

    items.push({
      type: "file",
      path: filePath,
      id: file.getId(),
      name: file.getName(),
      mime_type:
        file.getMimeType(),
      size_bytes:
        file.getSize(),
      url: file.getUrl(),
      updated_at:
        file
          .getLastUpdated()
          .toISOString()
    });
  }

  return items;
}

function collectFolderBlobs_(
  folder,
  relativePath,
  blobs
) {
  const files =
    folder.getFiles();

  while (files.hasNext()) {
    const file =
      files.next();

    const blob =
      file.getBlob();

    blob.setName(
      relativePath +
        "/" +
        file.getName()
    );

    blobs.push(blob);
  }

  const folders =
    folder.getFolders();

  while (folders.hasNext()) {
    const child =
      folders.next();

    collectFolderBlobs_(
      child,
      relativePath +
        "/" +
        child.getName(),
      blobs
    );
  }
}

function upsertTextFileInFolder_(
  folder,
  filename,
  contents,
  mimeType,
  overwrite
) {
  const files =
    folder.getFilesByName(
      filename
    );

  if (files.hasNext()) {
    const file = files.next();

    if (!overwrite) {
      return file;
    }

    file.setContent(contents);

    return file;
  }

  return folder.createFile(
    filename,
    contents,
    mimeType ||
      MimeType.PLAIN_TEXT
  );
}

function normalizeDrivePath_(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const path = String(value)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/");

  if (
    path === BOM_OS_ROOT_NAME
  ) {
    return "";
  }

  if (
    path.indexOf(
      BOM_OS_ROOT_NAME + "/"
    ) === 0
  ) {
    return path.substring(
      BOM_OS_ROOT_NAME.length + 1
    );
  }

  return path;
}

function requireDrivePath_(
  value,
  fieldName
) {
  const path =
    normalizeDrivePath_(value);

  if (!path) {
    throw new Error(
      "Missing required field: " +
        fieldName
    );
  }

  return path;
}

function splitDrivePath_(path) {
  const normalized =
    normalizeDrivePath_(path);

  if (!normalized) {
    return [];
  }

  const parts =
    normalized.split("/");

  parts.forEach(function(part) {
    if (
      !part ||
      part === "." ||
      part === ".."
    ) {
      throw new Error(
        "Invalid Drive path."
      );
    }
  });

  return parts;
}

function inferMimeType_(filename) {
  const lower =
    String(filename).toLowerCase();

  if (lower.endsWith(".json")) {
    return "application/json";
  }

  if (
    lower.endsWith(".yaml") ||
    lower.endsWith(".yml")
  ) {
    return "application/yaml";
  }

  if (lower.endsWith(".html")) {
    return "text/html";
  }

  if (lower.endsWith(".css")) {
    return "text/css";
  }

  if (lower.endsWith(".js")) {
    return "application/javascript";
  }

  if (lower.endsWith(".md")) {
    return "text/markdown";
  }

  if (lower.endsWith(".csv")) {
    return "text/csv";
  }

  if (lower.endsWith(".xml")) {
    return "application/xml";
  }

  if (lower.endsWith(".svg")) {
    return "image/svg+xml";
  }

  if (lower.endsWith(".txt")) {
    return "text/plain";
  }

  return "text/plain";
}

function isTextMimeType_(mimeType) {
  if (!mimeType) {
    return false;
  }

  return (
    mimeType.indexOf("text/") === 0 ||
    mimeType === "application/json" ||
    mimeType === "application/javascript" ||
    mimeType === "application/xml" ||
    mimeType === "application/yaml" ||
    mimeType ===
      "application/x-yaml" ||
    mimeType === "image/svg+xml"
  );
}

function ensureZipExtension_(name) {
  return /\.zip$/i.test(name)
    ? name
    : name + ".zip";
}

function clampDriveDepth_(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 10;
  }

  return Math.min(
    Math.max(
      Math.floor(number),
      0
    ),
    25
  );
}

function clampReadBytes_(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 500000;
  }

  return Math.min(
    Math.max(
      Math.floor(number),
      1
    ),
    5000000
  );
}

function ghostRequestSafe_(
  endpoint,
  method,
  payload
) {
  try {
    return {
      ok: true,
      data: ghostRequest_(
        endpoint,
        method,
        payload
      ),
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: String(
        error.message || error
      )
    };
  }
}

function findPageBySlug_(slug) {
  const normalizedSlug =
    normalizeSlug_(slug);

  const result = ghostRequest_(
    "pages/?limit=100&fields=id,title,slug,status,url,updated_at",
    "get"
  );

  const pages = result.pages || [];

  for (
    let i = 0;
    i < pages.length;
    i++
  ) {
    if (
      pages[i].slug ===
      normalizedSlug
    ) {
      return pages[i];
    }
  }

  return null;
}

function ghostRequest_(
  endpoint,
  method,
  payload
) {
  const ghostUrl =
    PROPERTIES.getProperty(
      "GHOST_URL"
    );

  const adminKey =
    PROPERTIES.getProperty(
      "GHOST_ADMIN_KEY"
    );

  if (!ghostUrl) {
    throw new Error(
      "Missing GHOST_URL in Script Properties."
    );
  }

  if (!adminKey) {
    throw new Error(
      "Missing GHOST_ADMIN_KEY in Script Properties."
    );
  }

  const token =
    createGhostToken_(adminKey);

  const url =
    ghostUrl.replace(/\/$/, "") +
    "/ghost/api/admin/" +
    endpoint.replace(/^\//, "");

  const options = {
    method: method,
    headers: {
      Authorization:
        "Ghost " + token,
      "Accept-Version": "v6.0"
    },
    muteHttpExceptions: true
  };

  if (payload !== undefined) {
    options.contentType =
      "application/json";

    options.payload =
      JSON.stringify(
        removeUndefined_(payload)
      );
  }

  const response =
    UrlFetchApp.fetch(
      url,
      options
    );

  const statusCode =
    response.getResponseCode();

  const responseText =
    response.getContentText();

  Logger.log(
    "Ghost HTTP " +
      statusCode
  );

  Logger.log(responseText);

  if (
    statusCode < 200 ||
    statusCode >= 300
  ) {
    throw new Error(
      "Ghost API error " +
        statusCode +
        ": " +
        responseText
    );
  }

  return responseText
    ? JSON.parse(responseText)
    : {};
}

function createGhostToken_(adminKey) {
  const parts =
    adminKey.trim().split(":");

  if (parts.length !== 2) {
    throw new Error(
      "Invalid GHOST_ADMIN_KEY format."
    );
  }

  const keyId = parts[0];

  const secretBytes =
    hexToBytes_(parts[1]);

  const now =
    Math.floor(
      Date.now() / 1000
    );

  const header =
    base64UrlText_(
      JSON.stringify({
        alg: "HS256",
        typ: "JWT",
        kid: keyId
      })
    );

  const payload =
    base64UrlText_(
      JSON.stringify({
        iat: now,
        exp: now + 300,
        aud: "/admin/"
      })
    );

  const unsignedToken =
    header + "." + payload;

  const signature =
    Utilities.computeHmacSignature(
      Utilities.MacAlgorithm
        .HMAC_SHA_256,
      Utilities
        .newBlob(unsignedToken)
        .getBytes(),
      secretBytes
    );

  return (
    unsignedToken +
    "." +
    base64UrlBytes_(signature)
  );
}

function validateConnectorToken_(
  providedToken
) {
  const requiredToken =
    PROPERTIES.getProperty(
      "CONNECTOR_TOKEN"
    );

  if (!requiredToken) {
    throw new Error(
      "Missing CONNECTOR_TOKEN in Script Properties."
    );
  }

  if (
    !providedToken ||
    providedToken !== requiredToken
  ) {
    throw new Error(
      "Unauthorized connector request."
    );
  }
}

function requirePublishConfirmation_(
  request
) {
  if (
    request.confirm_publish !== true
  ) {
    throw new Error(
      "Publishing requires confirm_publish=true."
    );
  }
}

function parseRequest_(e) {
  if (
    !e ||
    !e.postData ||
    !e.postData.contents
  ) {
    throw new Error(
      "Missing JSON request body."
    );
  }

  try {
    return JSON.parse(
      e.postData.contents
    );
  } catch (error) {
    throw new Error(
      "Request body must be valid JSON."
    );
  }
}

function requireText_(
  value,
  fieldName
) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      "Missing required field: " +
        fieldName
    );
  }

  return value.trim();
}

function optionalText_(value) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return undefined;
  }

  return value.trim();
}

function optionalSlug_(value) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return undefined;
  }

  return normalizeSlug_(value);
}

function normalizeSlug_(value) {
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

  if (!slug) {
    throw new Error(
      "Unable to create a valid slug."
    );
  }

  return slug;
}

function normalizeTags_(tags) {
  if (!tags) {
    return undefined;
  }

  if (!Array.isArray(tags)) {
    throw new Error(
      "tags must be an array."
    );
  }

  return tags.map(
    function(tag) {
      if (
        typeof tag === "string"
      ) {
        return {
          name: tag
        };
      }

      return tag;
    }
  );
}

function clampLimit_(value) {
  const number =
    Number(value || 10);

  if (!Number.isFinite(number)) {
    return 10;
  }

  return Math.min(
    Math.max(
      Math.floor(number),
      1
    ),
    50
  );
}

function removeUndefined_(value) {
  if (Array.isArray(value)) {
    return value.map(
      removeUndefined_
    );
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const cleaned = {};

    Object.keys(value).forEach(
      function(key) {
        if (
          value[key] !==
          undefined
        ) {
          cleaned[key] =
            removeUndefined_(
              value[key]
            );
        }
      }
    );

    return cleaned;
  }

  return value;
}

function hexToBytes_(hex) {
  if (
    !/^[0-9a-fA-F]+$/.test(hex) ||
    hex.length % 2 !== 0
  ) {
    throw new Error(
      "Ghost secret is not valid hexadecimal."
    );
  }

  const bytes = [];

  for (
    let i = 0;
    i < hex.length;
    i += 2
  ) {
    let value =
      parseInt(
        hex.substring(
          i,
          i + 2
        ),
        16
      );

    if (value > 127) {
      value -= 256;
    }

    bytes.push(value);
  }

  return bytes;
}

function base64UrlText_(text) {
  return Utilities
    .base64EncodeWebSafe(
      Utilities
        .newBlob(text)
        .getBytes()
    )
    .replace(/=+$/, "");
}

function base64UrlBytes_(bytes) {
  return Utilities
    .base64EncodeWebSafe(bytes)
    .replace(/=+$/, "");
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(
      JSON.stringify(
        data,
        null,
        2
      )
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}

function authorizeDriveAccess() {
  const folder = DriveApp.createFolder("BOMSociety OS Authorization Test");
  folder.setTrashed(true);
}

function writeProject_(request) {
  if (!Array.isArray(request.files)) {
    throw new Error(
      "write_project requires files as an array."
    );
  }

  if (!request.files.length) {
    throw new Error(
      "write_project requires at least one file."
    );
  }

  const maxFiles = 500;

  if (request.files.length > maxFiles) {
    throw new Error(
      "write_project supports a maximum of " +
        maxFiles +
        " files per request."
    );
  }

  const projectName =
    optionalText_(request.project_name) ||
    "BOMSociety OS Project";

  const overwrite =
    request.overwrite !== false;

  const created = [];
  const updated = [];
  const failed = [];

  request.files.forEach(
    function(fileSpec, index) {
      try {
        if (
          !fileSpec ||
          typeof fileSpec !== "object"
        ) {
          throw new Error(
            "File entry must be an object."
          );
        }

        const path =
          requireDrivePath_(
            fileSpec.path,
            "files[" +
              index +
              "].path"
          );

        if (
          typeof fileSpec.contents !==
          "string"
        ) {
          throw new Error(
            "files[" +
              index +
              "].contents must be a string."
          );
        }

        const encoding =
          optionalText_(
            fileSpec.encoding
          ) || "utf-8";

        if (
          encoding !== "utf-8" &&
          encoding !== "base64"
        ) {
          throw new Error(
            "Unsupported encoding: " +
              encoding
          );
        }

        const pathParts =
          splitDrivePath_(path);

        const filename =
          pathParts.pop();

        if (!filename) {
          throw new Error(
            "File path requires a filename."
          );
        }

        const folderPath =
          pathParts.join("/");

        const folder =
          resolveFolderPath_(
            folderPath,
            true
          );

        const mimeType =
          optionalText_(
            fileSpec.mime_type
          ) ||
          inferMimeType_(filename);

        const existingFiles =
          folder.getFilesByName(
            filename
          );

        if (existingFiles.hasNext()) {
          const existing =
            existingFiles.next();

          if (!overwrite) {
            throw new Error(
              "File exists and overwrite=false."
            );
          }

          if (encoding === "base64") {
            const bytes =
              Utilities.base64Decode(
                fileSpec.contents
              );

            existing.setContent(
              Utilities
                .newBlob(bytes)
                .getDataAsString()
            );
          } else {
            existing.setContent(
              fileSpec.contents
            );
          }

          updated.push({
            path: path,
            id: existing.getId(),
            name: existing.getName(),
            mime_type:
              existing.getMimeType(),
            size_bytes:
              existing.getSize(),
            url: existing.getUrl(),
            updated_at:
              existing
                .getLastUpdated()
                .toISOString()
          });

          return;
        }

        let blob;

        if (encoding === "base64") {
          const bytes =
            Utilities.base64Decode(
              fileSpec.contents
            );

          blob = Utilities.newBlob(
            bytes,
            mimeType,
            filename
          );
        } else {
          blob = Utilities.newBlob(
            fileSpec.contents,
            mimeType,
            filename
          );
        }

        const createdFile =
          folder.createFile(blob);

        created.push({
          path: path,
          id: createdFile.getId(),
          name: createdFile.getName(),
          mime_type:
            createdFile.getMimeType(),
          size_bytes:
            createdFile.getSize(),
          url: createdFile.getUrl(),
          updated_at:
            createdFile
              .getLastUpdated()
              .toISOString()
        });
      } catch (error) {
        failed.push({
          index: index,
          path:
            fileSpec &&
            fileSpec.path
              ? String(fileSpec.path)
              : null,
          error: String(
            error.message || error
          )
        });
      }
    }
  );

  const manifestPath =
    "10_RELEASES/" +
    normalizeSlug_(projectName) +
    "-write-project-manifest-" +
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() ||
        "America/Chicago",
      "yyyyMMdd-HHmmss"
    ) +
    ".json";

  const manifestContents =
    JSON.stringify(
      {
        project_name: projectName,
        action: "write_project",
        generated_at:
          new Date().toISOString(),
        total_requested:
          request.files.length,
        created_count:
          created.length,
        updated_count:
          updated.length,
        failed_count:
          failed.length,
        created: created,
        updated: updated,
        failed: failed
      },
      null,
      2
    );

  writeFile_({
    path: manifestPath,
    contents: manifestContents,
    mime_type:
      "application/json",
    encoding: "utf-8",
    overwrite: true
  });

  return {
    success:
      failed.length === 0,
    action: "write_project",
    project_name: projectName,
    requested_count:
      request.files.length,
    created_count:
      created.length,
    updated_count:
      updated.length,
    failed_count:
      failed.length,
    created: created,
    updated: updated,
    failed: failed,
    manifest_path:
      manifestPath
  };
}

function readProject_(request) {
  const path =
    normalizeDrivePath_(
      request.path || ""
    );

  const maxFiles =
    clampProjectFileCount_(
      request.max_files
    );

  const maxTotalBytes =
    clampProjectTotalBytes_(
      request.max_total_bytes
    );

  const folder =
    resolveFolderPath_(
      path,
      false
    );

  if (!folder) {
    throw new Error(
      "Folder not found: " +
        path
    );
  }

  const files = [];
  const skipped = [];

  const state = {
    file_count: 0,
    total_bytes: 0,
    stopped: false
  };

  readProjectFolderRecursive_(
    folder,
    path,
    files,
    skipped,
    state,
    maxFiles,
    maxTotalBytes
  );

  return {
    success: true,
    action: "read_project",
    path: path,
    folder_id: folder.getId(),
    folder_url: folder.getUrl(),
    file_count:
      files.length,
    total_bytes:
      state.total_bytes,
    max_files:
      maxFiles,
    max_total_bytes:
      maxTotalBytes,
    truncated:
      state.stopped,
    files: files,
    skipped: skipped
  };
}

function readProjectFolderRecursive_(
  folder,
  basePath,
  files,
  skipped,
  state,
  maxFiles,
  maxTotalBytes
) {
  if (state.stopped) {
    return;
  }

  const folderFiles =
    folder.getFiles();

  while (
    folderFiles.hasNext() &&
    !state.stopped
  ) {
    const file =
      folderFiles.next();

    const relativePath =
      basePath
        ? basePath +
          "/" +
          file.getName()
        : file.getName();

    const size =
      file.getSize();

    if (
      state.file_count >=
      maxFiles
    ) {
      state.stopped = true;
      break;
    }

    if (
      state.total_bytes + size >
      maxTotalBytes
    ) {
      skipped.push({
        path: relativePath,
        reason:
          "max_total_bytes exceeded",
        size_bytes: size
      });

      state.stopped = true;
      break;
    }

    const mimeType =
      file.getMimeType();

    let contents;
    let encoding;

    if (
      isTextMimeType_(
        mimeType
      )
    ) {
      contents =
        file
          .getBlob()
          .getDataAsString(
            "UTF-8"
          );

      encoding = "utf-8";
    } else {
      contents =
        Utilities.base64Encode(
          file
            .getBlob()
            .getBytes()
        );

      encoding = "base64";
    }

    files.push({
      path: relativePath,
      id: file.getId(),
      name: file.getName(),
      mime_type:
        mimeType,
      size_bytes:
        size,
      encoding: encoding,
      contents: contents,
      updated_at:
        file
          .getLastUpdated()
          .toISOString(),
      url: file.getUrl()
    });

    state.file_count += 1;
    state.total_bytes += size;
  }

  const childFolders =
    folder.getFolders();

  while (
    childFolders.hasNext() &&
    !state.stopped
  ) {
    const child =
      childFolders.next();

    const childPath =
      basePath
        ? basePath +
          "/" +
          child.getName()
        : child.getName();

    readProjectFolderRecursive_(
      child,
      childPath,
      files,
      skipped,
      state,
      maxFiles,
      maxTotalBytes
    );
  }
}

function clampProjectFileCount_(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return 250;
  }

  return Math.min(
    Math.max(
      Math.floor(number),
      1
    ),
    500
  );
}

function clampProjectTotalBytes_(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return 3000000;
  }

  return Math.min(
    Math.max(
      Math.floor(number),
      1
    ),
    10000000
  );
}