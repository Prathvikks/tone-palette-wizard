# ChromaTone: Skin Tone Analysis and Color Recommendation System
# Google Colab Compatible Python Code

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import seaborn as sns
from collections import defaultdict
import warnings
warnings.filterwarnings('ignore')

# Skin Tone Scale Mapping
SKIN_TONE_SCALE = {
    1: {'name': 'Porcelain', 'hex': '#f6ede4', 'lightness_range': (85, 100)},
    2: {'name': 'Ivory', 'hex': '#f3e7db', 'lightness_range': (80, 85)},
    3: {'name': 'Light Beige', 'hex': '#f7ead0', 'lightness_range': (75, 80)},
    4: {'name': 'Warm Beige', 'hex': '#eadaba', 'lightness_range': (70, 75)},
    5: {'name': 'Golden Beige', 'hex': '#d7bd96', 'lightness_range': (65, 70)},
    6: {'name': 'Tan', 'hex': '#a07e56', 'lightness_range': (55, 65)},
    7: {'name': 'Medium Brown', 'hex': '#825c43', 'lightness_range': (45, 55)},
    8: {'name': 'Deep Brown', 'hex': '#604134', 'lightness_range': (35, 45)},
    9: {'name': 'Dark Espresso', 'hex': '#3a312a', 'lightness_range': (25, 35)},
    10: {'name': 'Ebony', 'hex': '#292421', 'lightness_range': (0, 25)}
}

# Color Recommendations Database
UPPER_WEAR_RECOMMENDATIONS = {
    'warm': {
        'colors': ['Warm Brown', 'Terracotta', 'Camel', 'Burnt Orange', 'Mustard Yellow',
                  'Rust Red', 'Golden Beige', 'Coral Pink', 'Olive Green', 'Cream White'],
        'undertones': ['Golden', 'Yellow', 'Peach']
    },
    'cool': {
        'colors': ['Navy Blue', 'Crisp White', 'Steel Blue', 'Charcoal Grey', 'Emerald Green',
                  'Royal Purple', 'Cool Pink', 'Silver Grey', 'Icy Blue', 'Deep Teal'],
        'undertones': ['Pink', 'Red', 'Blue']
    },
    'neutral': {
        'colors': ['Classic Black', 'Pure White', 'Medium Grey', 'Sage Green', 'Taupe Brown',
                  'Soft Beige', 'Dusty Rose', 'Slate Blue', 'Warm Ivory', 'Mushroom Grey'],
        'undertones': ['Balanced', 'Mixed']
    }
}

OUTFIT_EXAMPLES = {
    'warm': [
        "Terracotta blouse with black trousers and gold accessories",
        "Burnt orange sweater with dark denim jeans",
        "Camel-colored cardigan with white pants and brown belt"
    ],
    'cool': [
        "Navy blue shirt with beige chinos and silver watch",
        "Emerald green top with white jeans and pearl necklace",
        "Steel blue blouse with charcoal grey trousers"
    ],
    'neutral': [
        "Charcoal grey shirt with dark denim and black leather belt",
        "Sage green cardigan with cream-colored pants",
        "Classic white blouse with taupe brown blazer"
    ]
}

def hex_to_rgb(hex_color):
    """Convert hex color to RGB values"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hsl(r, g, b):
    """Convert RGB to HSL"""
    r, g, b = r/255.0, g/255.0, b/255.0
    max_val = max(r, g, b)
    min_val = min(r, g, b)
    h, s, l = 0, 0, (max_val + min_val) / 2

    if max_val == min_val:
        h = s = 0  # achromatic
    else:
        d = max_val - min_val
        s = d / (2 - max_val - min_val) if l > 0.5 else d / (max_val + min_val)
        if max_val == r:
            h = (g - b) / d + (6 if g < b else 0)
        elif max_val == g:
            h = (b - r) / d + 2
        elif max_val == b:
            h = (r - g) / d + 4
        h /= 6

    return h * 360, s * 100, l * 100

def determine_skin_tone_level(lightness):
    """Map lightness value to skin tone level"""
    for level, data in SKIN_TONE_SCALE.items():
        min_l, max_l = data['lightness_range']
        if min_l <= lightness < max_l:
            return level, data['name']
    return 10, 'Ebony'  # Default to darkest

def determine_undertone(hue):
    """Determine skin undertone based on hue"""
    if 20 <= hue <= 50:
        return 'warm', 'Golden/Yellow'
    elif hue >= 300 or hue <= 20:
        return 'cool', 'Pink/Red'
    else:
        return 'neutral', 'Balanced'

def analyze_skin_tone_from_colors(dominant_colors):
    """Analyze skin tone from dominant colors extracted from image"""
    hsl_values = []
    
    for hex_color in dominant_colors:
        r, g, b = hex_to_rgb(hex_color)
        h, s, l = rgb_to_hsl(r, g, b)
        hsl_values.append((h, s, l))
    
    # Calculate average values
    avg_hue = np.mean([h for h, s, l in hsl_values])
    avg_lightness = np.mean([l for h, s, l in hsl_values])
    
    # Determine skin tone characteristics
    level, tone_name = determine_skin_tone_level(avg_lightness)
    undertone_type, undertone_desc = determine_undertone(avg_hue)
    
    return {
        'skin_tone_level': level,
        'skin_tone_name': tone_name,
        'undertone_type': undertone_type,
        'undertone_description': undertone_desc,
        'lightness': avg_lightness,
        'hue': avg_hue
    }

def get_upper_wear_recommendations(undertone_type):
    """Get upper wear color recommendations based on undertone"""
    return UPPER_WEAR_RECOMMENDATIONS[undertone_type]['colors']

def get_outfit_examples(undertone_type):
    """Get outfit examples based on undertone"""
    return OUTFIT_EXAMPLES[undertone_type][:2]  # Return top 2 examples

def create_sample_dataset():
    """Create a comprehensive sample dataset for training"""
    
    # Sample data representing different skin tones and their color preferences
    sample_data = []
    
    # Generate data for each skin tone level
    for level in range(1, 11):
        tone_info = SKIN_TONE_SCALE[level]
        tone_name = tone_info['name']
        
        # For each undertone type
        for undertone in ['warm', 'cool', 'neutral']:
            upper_wear_colors = get_upper_wear_recommendations(undertone)
            outfit_examples = get_outfit_examples(undertone)
            
            sample_data.append({
                'Skin_Tone_Name': tone_name,
                'Skin_Tone_Level': level,
                'Undertone_Type': undertone,
                'Upper_Wear_Colors': ', '.join(upper_wear_colors),
                'Example_Outfit_Ideas': ' | '.join(outfit_examples)
            })
    
    return pd.DataFrame(sample_data)

def process_color_palette_data(df):
    """Process and clean the color palette dataset"""
    
    # Data cleaning and preprocessing
    df_cleaned = df.copy()
    
    # Remove any null values
    df_cleaned = df_cleaned.dropna()
    
    # Standardize text formatting
    df_cleaned['Skin_Tone_Name'] = df_cleaned['Skin_Tone_Name'].str.title()
    df_cleaned['Undertone_Type'] = df_cleaned['Undertone_Type'].str.lower()
    
    # Split color lists for analysis
    df_cleaned['Color_Count'] = df_cleaned['Upper_Wear_Colors'].apply(
        lambda x: len(x.split(', ')) if pd.notna(x) else 0
    )
    
    return df_cleaned

def analyze_color_preferences(df):
    """Analyze color preferences across different skin tones"""
    
    analysis_results = {}
    
    # Group by skin tone level
    for level in df['Skin_Tone_Level'].unique():
        level_data = df[df['Skin_Tone_Level'] == level]
        
        # Get most common colors for this skin tone level
        all_colors = []
        for colors_str in level_data['Upper_Wear_Colors']:
            if pd.notna(colors_str):
                all_colors.extend([color.strip() for color in colors_str.split(',')])
        
        color_counts = pd.Series(all_colors).value_counts()
        
        analysis_results[level] = {
            'skin_tone_name': level_data['Skin_Tone_Name'].iloc[0],
            'most_popular_colors': color_counts.head(5).to_dict(),
            'total_combinations': len(level_data)
        }
    
    return analysis_results

def visualize_skin_tone_distribution(df):
    """Create visualizations for skin tone and color analysis"""
    
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    
    # 1. Skin Tone Level Distribution
    skin_tone_counts = df['Skin_Tone_Level'].value_counts().sort_index()
    axes[0, 0].bar(skin_tone_counts.index, skin_tone_counts.values, color='skyblue')
    axes[0, 0].set_title('Distribution of Skin Tone Levels')
    axes[0, 0].set_xlabel('Skin Tone Level')
    axes[0, 0].set_ylabel('Count')
    
    # 2. Undertone Distribution
    undertone_counts = df['Undertone_Type'].value_counts()
    axes[0, 1].pie(undertone_counts.values, labels=undertone_counts.index, autopct='%1.1f%%')
    axes[0, 1].set_title('Distribution of Undertone Types')
    
    # 3. Color Count Distribution
    color_counts = df['Color_Count'].value_counts().sort_index()
    axes[1, 0].bar(color_counts.index, color_counts.values, color='lightgreen')
    axes[1, 0].set_title('Distribution of Color Recommendations per Entry')
    axes[1, 0].set_xlabel('Number of Colors')
    axes[1, 0].set_ylabel('Count')
    
    # 4. Skin Tone vs Undertone Heatmap
    heatmap_data = df.groupby(['Skin_Tone_Level', 'Undertone_Type']).size().unstack(fill_value=0)
    sns.heatmap(heatmap_data, annot=True, fmt='d', cmap='YlOrRd', ax=axes[1, 1])
    axes[1, 1].set_title('Skin Tone Level vs Undertone Type')
    
    plt.tight_layout()
    plt.show()

def export_recommendations_csv(df, filename='chromatone_recommendations.csv'):
    """Export the processed dataset to CSV"""
    df.to_csv(filename, index=False)
    print(f"Dataset exported to {filename}")
    return filename

# ===== MAIN EXECUTION =====

def main():
    """Main execution function for Google Colab"""
    
    print("🎨 ChromaTone: Skin Tone Analysis and Color Recommendation System")
    print("=" * 60)
    
    # 1. Create sample dataset
    print("\n📊 Creating Sample Dataset...")
    df_sample = create_sample_dataset()
    print(f"Sample dataset created with {len(df_sample)} entries")
    
    # 2. Process and clean data
    print("\n🧹 Processing and Cleaning Data...")
    df_cleaned = process_color_palette_data(df_sample)
    print("Data cleaning completed")
    
    # 3. Display dataset summary
    print("\n📋 Dataset Summary:")
    print(f"Total entries: {len(df_cleaned)}")
    print(f"Skin tone levels: {df_cleaned['Skin_Tone_Level'].nunique()}")
    print(f"Undertone types: {df_cleaned['Undertone_Type'].nunique()}")
    
    # 4. Show sample data
    print("\n🔍 Sample Data Preview:")
    print(df_cleaned.head())
    
    # 5. Analyze color preferences
    print("\n🎯 Analyzing Color Preferences by Skin Tone...")
    color_analysis = analyze_color_preferences(df_cleaned)
    
    for level, analysis in color_analysis.items():
        print(f"\nSkin Tone Level {level} - {analysis['skin_tone_name']}:")
        print(f"  Most Popular Colors: {list(analysis['most_popular_colors'].keys())[:3]}")
    
    # 6. Create visualizations
    print("\n📈 Creating Visualizations...")
    visualize_skin_tone_distribution(df_cleaned)
    
    # 7. Export dataset
    print("\n💾 Exporting Dataset...")
    csv_filename = export_recommendations_csv(df_cleaned)
    
    # 8. Example skin tone analysis
    print("\n🧪 Example Skin Tone Analysis:")
    sample_colors = ['#f3e7db', '#eadaba', '#d7bd96', '#f6ede4']  # Sample extracted colors
    analysis_result = analyze_skin_tone_from_colors(sample_colors)
    
    print(f"Sample Analysis Result:")
    print(f"  Skin Tone: {analysis_result['skin_tone_name']} (Level {analysis_result['skin_tone_level']})")
    print(f"  Undertone: {analysis_result['undertone_description']} ({analysis_result['undertone_type']})")
    
    recommended_colors = get_upper_wear_recommendations(analysis_result['undertone_type'])
    outfit_examples = get_outfit_examples(analysis_result['undertone_type'])
    
    print(f"  Recommended Colors: {', '.join(recommended_colors[:5])}")
    print(f"  Outfit Examples: {outfit_examples[0]}")
    
    print("\n✅ ChromaTone Analysis Complete!")
    return df_cleaned, color_analysis

# Run the main function
if __name__ == "__main__":
    df_results, analysis_results = main()