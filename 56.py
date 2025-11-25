def compute_contrast(image_rgba):
    arr = np.array(image_rgba)
    alpha = arr[..., 3]

    # Mask opaque pixels (>10 alpha threshold)
    mask = alpha > 10

    if mask.sum() == 0:
        return 0.0

    rgb = arr[..., :3][mask]

    # Convert to perceived luminance
    lum = 0.2126 * rgb[:, 0] + 0.7152 * rgb[:, 1] + 0.0722 * rgb[:, 2]

    I_max = lum.max()
    I_min = lum.min()

    if I_max + I_min == 0:
        return 0.0

    # Michelson contrast
    contrast = (I_max - I_min) / (I_max + I_min)
    return float(round(contrast, 4))
