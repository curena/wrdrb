package models;

/**
 * @author Cecil Urena
 */
public enum ArticleType {
    TOP("top"), BOTTOM("bottom"), ACCESSORY("accessory"), SHOES("shoes"), OUTERWEAR("outerwear"), UNDERWEAR
            ("underwear");

    public String type;

    ArticleType(String type) {
        this.type = type;
    }
}
