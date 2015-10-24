package models;

import java.util.Date;
import java.util.List;

/**
 * @author Cecil Urena
 */
public class Outfit {
    private List<ClothingArticle> clothingArticles;
    private String name;
    private Date lastWorn;
    private Occasion occasion;
}
